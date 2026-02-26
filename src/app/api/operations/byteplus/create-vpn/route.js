import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';

const execPromise = util.promisify(exec);

function shellEscape(value) {
    return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function validateName(name) {
    return /^[a-zA-Z0-9._-]{2,50}$/.test(name);
}

function extractBase64Payload(output) {
    const marker = '__B64_BEGIN__';
    const markerIndex = output.lastIndexOf(marker);
    if (markerIndex === -1) {
        return '';
    }

    const candidate = output
        .slice(markerIndex + marker.length)
        .replace(/\s+/g, '')
        .trim();

    return /^[A-Za-z0-9+/=]+$/.test(candidate) ? candidate : '';
}

export async function POST(request) {
    try {
        const { name, email } = await request.json();

        if (!name || !email) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields: name and email' },
                { status: 400 }
            );
        }

        const sanitizedName = String(name).trim();
        const sanitizedEmail = String(email).trim();

        if (!validateName(sanitizedName)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid name format. Allowed: a-z, A-Z, 0-9, dot, underscore, hyphen (2-50 chars)'
                },
                { status: 400 }
            );
        }

        if (!/^\S+@\S+\.\S+$/.test(sanitizedEmail)) {
            return NextResponse.json(
                { success: false, message: 'Invalid email format' },
                { status: 400 }
            );
        }

        const escapedName = shellEscape(sanitizedName);
        const ovpnSourcePath = `/root/client-configs/files/${sanitizedName}.ovpn`;

        const privilegedSteps = [
            `cd /etc/openvpn/easy-rsa && EASYRSA_BATCH=1 ./easyrsa build-client-full ${escapedName} nopass`,
            `/root/client-configs/make_config.sh ${escapedName}`,
            `echo __B64_BEGIN__`,
            `base64 -w 0 ${shellEscape(ovpnSourcePath)}`
        ];

        const remoteScript = [
            'set -e',
            `sudo -n bash -lc ${shellEscape(privilegedSteps[0])}`,
            `sudo -n ${privilegedSteps[1]}`,
            `sudo -n ${privilegedSteps[2]}`,
            `sudo -n ${privilegedSteps[3]}`
        ].join('; ');

        const remoteCommand = `bash -lc ${shellEscape(remoteScript)}`;
        const sshUser = process.env.BYTEPLUS_VPN_SSH_USER || 'jventures';
        const sshHost = process.env.BYTEPLUS_VPN_SSH_HOST || '192.168.80.1';
        const sshKeyPath = (process.env.BYTEPLUS_VPN_SSH_KEY_PATH || '').trim();

        if (sshKeyPath && !fs.existsSync(sshKeyPath)) {
            return NextResponse.json(
                { success: false, message: `SSH key file not found: ${sshKeyPath}` },
                { status: 500 }
            );
        }

        const sshCommandParts = [
            'ssh',
            '-o BatchMode=yes',
            '-o StrictHostKeyChecking=no',
            '-o UserKnownHostsFile=/dev/null'
        ];

        if (sshKeyPath) {
            sshCommandParts.push('-o IdentitiesOnly=yes');
            sshCommandParts.push(`-i ${shellEscape(sshKeyPath)}`);
        }

        sshCommandParts.push(`${sshUser}@${sshHost}`);
        sshCommandParts.push(shellEscape(remoteCommand));
        const sshCommand = sshCommandParts.join(' ');

        const { stdout, stderr } = await execPromise(sshCommand, {
            timeout: 180000,
            maxBuffer: 20 * 1024 * 1024,
        });

        if (stderr && stderr.trim()) {
            console.warn('VPN create stderr:', stderr);
        }

        const fileContentBase64 = extractBase64Payload(stdout);
        if (!fileContentBase64) {
            return NextResponse.json(
                { success: false, message: 'VPN created but OVPN base64 payload is invalid or missing' },
                { status: 500 }
            );
        }

        const finalFileName = `hw_uat_${sanitizedName}.ovpn`;

        return NextResponse.json({
            success: true,
            message: 'VPN account created successfully',
            fileName: finalFileName,
            fileContentBase64,
            metadata: {
                name: sanitizedName,
                email: sanitizedEmail,
                server: sshHost,
                keyPathConfigured: Boolean(sshKeyPath),
            }
        });
    } catch (error) {
        const rawMessage = error?.message || 'Unknown error';
        const message = rawMessage.includes('Permission denied (publickey')
            ? 'SSH authentication failed (public key denied)'
            : rawMessage.includes('sudo: a password is required') || rawMessage.includes('sudo:')
                ? 'Remote sudo permission is required for VPN commands'
                : rawMessage.includes('cd: /etc/openvpn/easy-rsa: Permission denied') || rawMessage.includes('/root/client-configs')
                    ? 'Remote permission denied for VPN directories. Please use sudo-capable account.'
                    : rawMessage.includes('Could not resolve hostname')
                        ? 'SSH host not reachable or DNS resolution failed'
                        : rawMessage.includes('No such file or directory')
                            ? 'OVPN file not found on remote server'
                            : `Failed to create VPN account: ${rawMessage}`;

        return NextResponse.json(
            { success: false, message },
            { status: 500 }
        );
    }
}
