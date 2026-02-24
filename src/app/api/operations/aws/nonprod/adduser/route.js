import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execPromise = util.promisify(exec);

export async function POST(request) {
    try {
        const { serverIps, users } = await request.json();

        if (!serverIps || !users || !Array.isArray(users) || users.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields or invalid users list' },
                { status: 400 }
            );
        }

        // Validate each user object
        for (const u of users) {
            if (!u.username || !u.email) {
                return NextResponse.json(
                    { success: false, message: 'Every user entry must have a username and email' },
                    { status: 400 }
                );
            }
        }

        // Parse textarea inputs (split by newline and trim)
        const ipList = serverIps.split('\n').map(ip => ip.trim()).filter(ip => ip !== '');

        // Define temporary file paths and write data
        const tmpDir = os.tmpdir();
        const jobId = 'JOB-' + Date.now();
        const ipFilePath = path.join(tmpDir, `ips_${jobId}.txt`);
        const userFilePath = path.join(tmpDir, `users_${jobId}.txt`);
        // Assuming the script is in the 'script' folder relative to this route file's directory structure in the project
        // Note: In Next.js build, files might not be where you expect. Using absolute path for dev environment.
        const scriptPath = path.resolve('./src/app/api/operations/aws/nonprod/adduser/script/adduservendor.sh');

        let scriptOutput = '';
        let emailLog = '';
        let executionSuccess = false;

        try {
            // Write IPs and Users to temp files
            await fs.writeFile(ipFilePath, ipList.join('\n'));
            await fs.writeFile(userFilePath, users.map(u => u.username).join('\n'));

            // Make script executable
            await execPromise(`chmod +x "${scriptPath}"`);

            // Execute script
            console.log(`Executing: ${scriptPath} ${ipFilePath} ${userFilePath}`);
            const { stdout, stderr } = await execPromise(`"${scriptPath}" "${ipFilePath}" "${userFilePath}"`);

            scriptOutput = stdout;
            if (stderr) console.error('Script stderr:', stderr);
            executionSuccess = true;

            // Process email notifications (simulated)
            const emailLog = users.map(u => `Sending private key for user '${u.username}' to email: ${u.email}`);
            console.log(emailLog.join('\n'));

            // Append Simulated Email Logic to Output like script does
            scriptOutput += '\n\n=== Email Notification Simulation ===\n' + emailLog.join('\n');

        } catch (execError) {
            console.error('Script Execution Error:', execError);
            scriptOutput = `Execution Failed: ${execError.message}`;
            // If execution fails, we might still want to return a partial success or specific error
            // depending on business logic. Here we'll treat it as a failure mostly.
        } finally {
            // Cleanup temp files
            try {
                await fs.unlink(ipFilePath);
                await fs.unlink(userFilePath);
            } catch (e) { console.warn('Temp file cleanup failed', e); }
        }

        const summary = `Request processed for ${users.length} users on ${ipList.length} servers.`;
        const details = {
            servers: ipList,
            users: users,
            jobId: jobId,
            executionLog: scriptOutput,
            emailStatus: emailLog
        };

        if (executionSuccess) {
            return NextResponse.json({
                success: true,
                message: 'Add User Access request executed successfully.',
                details: details,
                summary: summary
            });
        } else {
            return NextResponse.json({
                success: false,
                message: 'Script execution failed.',
                details: details
            }, { status: 500 });
        }

    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'An error occurred: ' + error.message },
            { status: 500 }
        );
    }
}
