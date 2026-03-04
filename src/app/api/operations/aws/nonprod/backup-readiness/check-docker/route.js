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

        // SSH fallback strategy:
        // 1) ubuntu + jventures-uat.pem
        // 2) jventures + id_ed25519
        const homeDir = process.env.HOME || '';
        const primaryKeyCandidates = [
            process.env.BACKUP_READINESS_SSH_KEY_PATH,
            homeDir ? path.join(homeDir, '.ssh', 'jventures-uat.pem') : null,
            '/app/jventures-uat.pem',
            path.join(process.cwd(), 'jventures-uat.pem')
        ].filter(Boolean);

        const fallbackKeyCandidates = [
            process.env.BACKUP_READINESS_SSH_FALLBACK_KEY_PATH,
            homeDir ? path.join(homeDir, '.ssh', 'id_ed25519') : null,
            '/app/id_ed25519',
            path.join(process.cwd(), 'id_ed25519')
        ].filter(Boolean);

        const sshStrategies = [
            {
                name: 'primary',
                user: 'ubuntu',
                keyCandidates: primaryKeyCandidates,
                keyLabel: 'jventures-uat.pem'
            },
            {
                name: 'fallback',
                user: 'jventures',
                keyCandidates: fallbackKeyCandidates,
                keyLabel: 'id_ed25519'
            }
        ];

        const attemptDetails = [];

        for (const strategy of sshStrategies) {
            const keyPath = strategy.keyCandidates.find((candidate) => fs.existsSync(candidate));

            if (!keyPath) {
                attemptDetails.push({
                    strategy: strategy.name,
                    user: strategy.user,
                    key: strategy.keyLabel,
                    success: false,
                    reason: 'SSH key not found',
                    checkedPaths: strategy.keyCandidates
                });
                continue;
            }

            const command = `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ConnectTimeout=8 -i ${keyPath} ${strategy.user}@${ip} "sudo docker ps"`;

            try {
                console.log(`Checking Docker on ${ip} with ${strategy.name}: ${command}`);
                const { stdout, stderr } = await execPromise(command);

                if (stderr) {
                    console.warn(`Docker Check Stderr (${strategy.name}): ${stderr}`);
                }

                return NextResponse.json({
                    success: true,
                    output: stdout || stderr || 'No output received.',
                    strategyUsed: strategy.name,
                    userUsed: strategy.user,
                    keyPathUsed: keyPath
                });
            } catch (attemptError) {
                attemptDetails.push({
                    strategy: strategy.name,
                    user: strategy.user,
                    key: strategy.keyLabel,
                    success: false,
                    keyPath,
                    errorMessage: attemptError.message,
                    command: attemptError.cmd,
                    stderr: attemptError.stderr
                });
            }
        }

        return NextResponse.json({
            success: false,
            message: 'All SSH strategies failed for Backup Readiness check-docker.',
            attempts: attemptDetails
        }, { status: 500 });

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
