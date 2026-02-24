import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);
const STATE_FILE = path.join(process.cwd(), 'backupec2_state.json');

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const refresh = searchParams.get('refresh') === 'true';

        let existingState = [];
        if (fs.existsSync(STATE_FILE)) {
            try {
                const data = fs.readFileSync(STATE_FILE, 'utf-8');
                existingState = JSON.parse(data);
            } catch (e) {
                console.error('Failed to parse existing state file:', e);
            }
        }

        // Return cached state if not refreshing and file exists
        if (!refresh && existingState.length > 0) {
            return NextResponse.json(existingState);
        }

        // If refresh=true or no state file, fetch from AWS
        const PROFILE = 'aws_nonprod';
        const REGION = 'ap-southeast-1';
        const VAULT_NAME = 'JVC-NONPROD-VAULT';

        // 1. List Recovery Points
        // We really want the latest recovery point per resource.
        const cmd = `aws backup list-recovery-points-by-backup-vault --backup-vault-name ${VAULT_NAME} --profile ${PROFILE} --region ${REGION} --output json`;

        console.log(`Executing: ${cmd}`);
        const { stdout } = await execPromise(cmd);
        const data = JSON.parse(stdout);

        if (!data.RecoveryPoints) {
            return NextResponse.json([]);
        }

        // 2. Group by ResourceArn to find latest
        const resourceMap = {};

        // To get the human-readable name, we often need to describe the original instance
        // But the original instance might be gone. 
        // We can try to get tags from the recovery point if available, or just show Instance ID.
        // AWS Backup recovery points for EC2 are AMIs. We can describe the AMI to get the name tag?

        for (const rp of data.RecoveryPoints) {
            if (rp.ResourceType !== 'EC2') continue;

            const resourceId = rp.ResourceArn.split('/').pop();
            const creationDate = new Date(rp.CreationDate);

            if (!resourceMap[resourceId] || creationDate > resourceMap[resourceId].creationDate) {
                resourceMap[resourceId] = {
                    resourceId: resourceId,
                    resourceArn: rp.ResourceArn,
                    recoveryPointArn: rp.RecoveryPointArn, // This is the AMI ARN for EC2
                    creationDate: creationDate,
                    status: rp.Status,
                    backupVaultName: rp.BackupVaultName
                };
            }
        }

        // 3. Enhance with Name Tag (Optional but good)
        // We have instance IDs (resourceId). We can try describe-instances to get current names if they exist.
        // If not, we might check AMI tags.
        // Let's try to get names for these instances.
        const instanceIds = Object.keys(resourceMap);
        if (instanceIds.length > 0) {
            try {
                const ids = instanceIds.join(' ');
                const nameCmd = `aws ec2 describe-instances --instance-ids ${ids} --query "Reservations[*].Instances[*].[InstanceId,Tags[?Key=='Name'].Value|[0]]" --output json --profile ${PROFILE} --region ${REGION}`;
                const { stdout: nameStdout } = await execPromise(nameCmd);
                const nameData = JSON.parse(nameStdout);

                // Flatten and map
                const nameMap = {};
                nameData.forEach(res => {
                    res.forEach(([id, name]) => {
                        nameMap[id] = name || id;
                    });
                });

                // Update resourceMap
                for (const id in resourceMap) {
                    resourceMap[id].name = nameMap[id] || `Instance (${id})`;
                }

            } catch (e) {
                console.warn('Failed to fetch instance names, using IDs', e.message);
                for (const id in resourceMap) {
                    resourceMap[id].name = `Instance (${id})`;
                }
            }
        }

        const newBackups = Object.values(resourceMap).map((item, index) => {
            // Find existing backup to preserve status and testDate
            const existing = existingState.find(b => b.resourceId === item.resourceId);

            return {
                id: index + 1,
                name: item.name,
                resourceId: item.resourceId,
                resourceArn: item.resourceArn, // Add resourceArn for fresh lookup
                recoveryPointArn: item.recoveryPointArn,
                creationDate: item.creationDate.toISOString(),
                status: existing ? existing.status : 'Available',
                testDate: existing ? existing.testDate : '-'
            };
        });

        // Save to state file
        fs.writeFileSync(STATE_FILE, JSON.stringify(newBackups, null, 2));

        return NextResponse.json(newBackups);

    } catch (error) {
        console.error('Backup List Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        
        // Basic validation: ensure it's an array
        if (!Array.isArray(body)) {
             return NextResponse.json({ success: false, message: 'Invalid data format' }, { status: 400 });
        }

        fs.writeFileSync(STATE_FILE, JSON.stringify(body, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Save State Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
