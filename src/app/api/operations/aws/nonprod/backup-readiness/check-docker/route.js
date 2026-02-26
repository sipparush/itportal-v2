import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = util.promisify(exec);

export async function POST(request) {
    try {
        const { ip } = await request.json();

        // Validate
        if (!ip) {
            return NextResponse.json({ success: false, message: 'IP address required' }, { status: 400 });
        }

        // Configuration
        const isTargetIpForQaTest = ip === '10.240.1.103';
        const USER = isTargetIpForQaTest ? 'jventures' : 'ubuntu';
        const homeSshKey = process.env.HOME
            ? path.join(process.env.HOME, '.ssh', 'jventures-uat.pem')
            : null;
        const keyCandidates = isTargetIpForQaTest
            ? [
                process.env.BACKUP_READINESS_QA_10103_KEY_PATH,
                process.env.BACKUP_READINESS_SSH_KEY_PATH,
                '/app/jventures-uat.pem',
                homeSshKey,
                path.join(process.cwd(), 'jventures-uat.pem')
            ].filter(Boolean)
            : [
                process.env.BACKUP_READINESS_SSH_KEY_PATH,
                '/app/jventures-uat.pem',
                path.join(process.cwd(), 'jventures-uat.pem')
            ].filter(Boolean);

        const keyPath = keyCandidates.find((candidate) => fs.existsSync(candidate));
        if (!keyPath) {
            return NextResponse.json({
                success: false,
                message: isTargetIpForQaTest
                    ? 'SSH key not found for QA target 10.240.1.103. Set BACKUP_READINESS_QA_10103_KEY_PATH (or BACKUP_READINESS_SSH_KEY_PATH) to jventures-uat.pem path.'
                    : 'SSH key not found for Backup Readiness. Set BACKUP_READINESS_SSH_KEY_PATH or mount jventures-uat.pem to /app/jventures-uat.pem.',
                checkedPaths: keyCandidates
            }, { status: 500 });
        }

        // Command: ssh -i key.pem user@ip 'docker ps'
        // Added standard ssh options to avoid host key prompts for ephemeral IPs
        const command = `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ${keyPath} ${USER}@${ip} "docker ps"`;

        console.log(`Checking Docker on ${ip}: ${command}`);
        const { stdout, stderr } = await execPromise(command);

        if (stderr) {
            console.warn(`Docker Check Stderr: ${stderr}`);
        }

        return NextResponse.json({
            success: true,
            output: stdout || stderr || 'No output received.'
        });

    } catch (error) {
        console.error('Docker Check Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message,
            command: error.cmd,
            details: error.stderr
        }, { status: 500 });
    }
}
