import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// --- SSH config (ควร sync กับ route.js หลัก) ---
const PROD_JUMP_HOST = process.env.PROD_SECURITY_PATCH_JUMP_HOST || '18.139.55.93';
const SSH_KEY_CANDIDATES = [
    process.env.PROD_SECURITY_PATCH_SSH_KEY_PATH,
    '/home/node/.ssh/jventures-prod.pem',
    path.join(process.env.HOME || '', '.ssh', 'jventures-prod.pem'),
    '/app/jventures-prod.pem',
    path.join(process.cwd(), 'jventures-prod.pem')
].filter(Boolean);

function getSshKeyPath() {
    return SSH_KEY_CANDIDATES.find((candidate) => fs.existsSync(candidate)) || null;
}

function isValidIpv4(ip) {
    return /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(String(ip || '').trim());
}

export async function POST(req) {
    try {
        const { instanceId, ip } = await req.json();
        if (!ip || !isValidIpv4(ip)) {
            return NextResponse.json({ success: false, message: 'Valid ip is required' }, { status: 400 });
        }

        const sshKeyPath = getSshKeyPath();
        if (!sshKeyPath) {
            return NextResponse.json({ success: false, message: 'SSH key not found' }, { status: 500 });
        }
        const username = 'jventures';
        // ใช้คำสั่ง update เฉพาะ security patch แบบ non-interactive
        const sshArgs = [
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'UserKnownHostsFile=/dev/null',
            '-o', 'BatchMode=yes',
            '-o', 'IdentitiesOnly=yes',
            '-o', 'LogLevel=ERROR',
            '-o', 'ConnectTimeout=10',
            '-i', sshKeyPath,
            `${username}@${PROD_JUMP_HOST}`,
            `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o LogLevel=ERROR -o ConnectTimeout=10 ${username}@${ip} \"sudo apt update && sudo unattended-upgrade -d\"`
        ];

        return await new Promise((resolve) => {
            const proc = spawn('ssh', sshArgs, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 10 * 60 * 1000 }); // 10 นาที
            let stdout = '';
            let stderr = '';
            let timeoutFired = false;

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            proc.on('error', (err) => {
                resolve(NextResponse.json({ success: false, message: err.message }, { status: 500 }));
            });

            proc.on('close', (code, signal) => {
                if (timeoutFired) {
                    resolve(NextResponse.json({ success: false, message: 'Update timed out', output: stdout, error: stderr }, { status: 504 }));
                } else if (code === 0) {
                    resolve(NextResponse.json({ success: true, output: stdout }));
                } else {
                    resolve(NextResponse.json({ success: false, message: stderr || `Exited with code ${code}` }, { status: 500 }));
                }
            });

            proc.on('timeout', () => {
                timeoutFired = true;
                proc.kill('SIGKILL');
            });
        });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
