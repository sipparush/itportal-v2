import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

export async function POST(request) {
    try {
        const { ip } = await request.json();

        // Validate
        if (!ip) {
            return NextResponse.json({ success: false, message: 'IP address required' }, { status: 400 });
        }

        // Configuration
        const USER = 'jventures';
        // Key is mounted at /app/jventures-uat.pem inside the container
        const KEY_PATH = '/app/jventures-uat.pem';

        // Command: ssh -i key.pem user@ip 'docker ps'
        // Added standard ssh options to avoid host key prompts for ephemeral IPs
        const command = `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ${KEY_PATH} ${USER}@${ip} "docker ps"`;

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
