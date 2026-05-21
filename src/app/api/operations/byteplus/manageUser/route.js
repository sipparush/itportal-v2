import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = '/home/sipparush/adduservendorbp.sh';
const KEY_OUTPUT_DIR = path.join(process.cwd(), 'collected_public_keys');
const ACCOUNT_PATTERN = /^[a-z_][a-z0-9_-]*$/i;
const DEFAULT_CONNECT_TIMEOUT_SECONDS = '10';

function normalizeRemoteIps(remoteIps) {
    if (!Array.isArray(remoteIps)) {
        return [];
    }

    return Array.from(
        new Set(
            remoteIps
                .map((value) => String(value || '').trim())
                .filter(Boolean)
        )
    );
}

function buildKeyFileName(account, ip) {
    return `${account}_${ip}.pem`;
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function resolveSshKeyPath(remoteIps) {
    const configuredKeyPath = String(process.env.BYTEPLUS_MANAGE_USER_SSH_KEY_PATH || '').trim();
    if (configuredKeyPath) {
        return configuredKeyPath;
    }

    for (const ip of remoteIps) {
        const candidate = `/home/sipparush/sipparush.la-jvc_bp_${ip}.pem`;
        if (await fileExists(candidate)) {
            return candidate;
        }
    }

    return '';
}

function buildFriendlyErrorMessage(details, sshKeyPath) {
    if (details.includes('Connection timed out')) {
        return `เชื่อมต่อ remote server ไม่สำเร็จ: SSH timeout ระหว่างเชื่อมต่อปลายทาง${sshKeyPath ? ` ด้วย key ${sshKeyPath}` : ''}`;
    }

    if (details.includes('Permission denied (publickey')) {
        return sshKeyPath
            ? `SSH authentication failed สำหรับ key ${sshKeyPath}`
            : 'SSH authentication failed: ต้องกำหนด key สำหรับการเชื่อมต่อ BytePlus';
    }

    if (details.includes('No such file or directory') && details.includes('.pem')) {
        return `ไม่พบ SSH key file ที่ต้องใช้เชื่อมต่อ${sshKeyPath ? `: ${sshKeyPath}` : ''}`;
    }

    return details || 'BytePlus manage user failed';
}

async function buildVmAccess(account, remoteIps) {
    return Promise.all(
        remoteIps.map(async (ip) => {
            const keyFileName = buildKeyFileName(account, ip);
            const keyFilePath = path.join(KEY_OUTPUT_DIR, keyFileName);
            const downloadUrl = await fileExists(keyFilePath)
                ? `/api/operations/byteplus/manageUser?file=${encodeURIComponent(keyFileName)}`
                : null;

            return {
                ip,
                downloadUrl
            };
        })
    );
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
        return NextResponse.json(
            { message: 'Missing file parameter' },
            { status: 400 }
        );
    }

    const safeFileName = path.basename(fileName);
    if (safeFileName !== fileName) {
        return NextResponse.json(
            { message: 'Invalid file parameter' },
            { status: 400 }
        );
    }

    const keyFilePath = path.join(KEY_OUTPUT_DIR, safeFileName);
    if (!(await fileExists(keyFilePath))) {
        return NextResponse.json(
            { message: 'Key file not found' },
            { status: 404 }
        );
    }

    const fileBuffer = await fs.readFile(keyFilePath);

    return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/x-pem-file',
            'Content-Disposition': `attachment; filename="${safeFileName}"`
        }
    });
}

export async function POST(request) {
    try {
        const { action, account, remoteIps } = await request.json();
        const normalizedAccount = String(account || '').trim();
        const normalizedRemoteIps = normalizeRemoteIps(remoteIps);

        if (!['create', 'update'].includes(action)) {
            return NextResponse.json(
                { message: 'Invalid action. Supported actions are create and update.' },
                { status: 400 }
            );
        }

        if (!normalizedAccount || normalizedRemoteIps.length === 0) {
            return NextResponse.json(
                { message: 'กรุณากรอก account และ remote IP อย่างน้อย 1 รายการ' },
                { status: 400 }
            );
        }

        if (!ACCOUNT_PATTERN.test(normalizedAccount)) {
            return NextResponse.json(
                { message: 'account ต้องเป็นตัวอักษร ตัวเลข _ หรือ - และห้ามมีช่องว่าง' },
                { status: 400 }
            );
        }

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'byteplus-manage-user-'));
        const ipFilePath = path.join(tempDir, 'ips.txt');
        const userFilePath = path.join(tempDir, 'users.txt');
        const sshKeyPath = await resolveSshKeyPath(normalizedRemoteIps);

        if (!sshKeyPath) {
            return NextResponse.json(
                { message: `ไม่พบ SSH key สำหรับ remote IP: ${normalizedRemoteIps.join(', ')}` },
                { status: 500 }
            );
        }

        if (!(await fileExists(sshKeyPath))) {
            return NextResponse.json(
                { message: `ไม่พบ SSH key file: ${sshKeyPath}` },
                { status: 500 }
            );
        }

        try {
            await fs.writeFile(ipFilePath, `${normalizedRemoteIps.join('\n')}\n`, 'utf8');
            await fs.writeFile(userFilePath, `${normalizedAccount}\n`, 'utf8');

            const { stdout, stderr } = await execFileAsync('bash', [SCRIPT_PATH, ipFilePath, userFilePath], {
                cwd: process.cwd(),
                maxBuffer: 10 * 1024 * 1024,
                timeout: 180000,
                env: {
                    ...process.env,
                    BYTEPLUS_SSH_KEY_PATH: sshKeyPath,
                    BYTEPLUS_SSH_CONNECT_TIMEOUT: process.env.BYTEPLUS_MANAGE_USER_SSH_CONNECT_TIMEOUT || DEFAULT_CONNECT_TIMEOUT_SECONDS
                }
            });

            const vmAccess = await buildVmAccess(normalizedAccount, normalizedRemoteIps);
            const record = {
                id: crypto.randomUUID(),
                account: normalizedAccount,
                vmAccess,
                updatedAt: new Date().toISOString(),
                executionSummary: stderr ? `${stdout}\n${stderr}`.trim() : stdout.trim()
            };

            return NextResponse.json({
                message: action === 'update'
                    ? `อัปเดตสิทธิ์ผู้ใช้ ${normalizedAccount} สำหรับ BytePlus สำเร็จ`
                    : `เพิ่มสิทธิ์ผู้ใช้ ${normalizedAccount} สำหรับ BytePlus สำเร็จ`,
                record
            });
        } catch (error) {
            const details = [error.stdout, error.stderr, error.message]
                .filter(Boolean)
                .join('\n')
                .trim();

            return NextResponse.json(
                {
                    message: buildFriendlyErrorMessage(details, sshKeyPath),
                    details,
                    sshKeyPath
                },
                { status: 500 }
            );
        } finally {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    } catch (error) {
        return NextResponse.json(
            { message: error.message || 'Unexpected error' },
            { status: 500 }
        );
    }
}