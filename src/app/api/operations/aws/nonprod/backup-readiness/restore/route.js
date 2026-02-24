import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);
const STATE_FILE = path.join(process.cwd(), 'backupec2_state.json');

export async function POST(request) {
    try {
        const { instanceName, recoveryPointArn, resourceArn } = await request.json();

        // Validate
        if (!instanceName) {
            return NextResponse.json({ success: false, message: 'Instance name required' }, { status: 400 });
        }

        // Configuration
        const SG_ID = 'sg-027f3b82ae7853b3d'; // Staging SG
        const SUBNET_ID = 'subnet-0abb00758262160db'; // Staging Subnet
        const PROFILE = 'aws_nonprod';
        const REGION = 'ap-southeast-1';
        const VAULT_NAME = 'JVC-NONPROD-VAULT';

        let runInstanceCmd = '';
        let targetAmiId = null;
        let constructedResourceArn = resourceArn;

        // If resourceArn is missing but we can infer it (e.g. from existing state or partial data), try that.
        // Or fetch Account ID once to construct it: arn:aws:ec2:region:account:instance/instance-id
        // But we don't have instance-id easily unless passed.

        // Priority 1: Fetch fresh recovery point by ResourceArn if provided
        if (constructedResourceArn) {
            console.log(`Fetching latest recovery point for Resource: ${constructedResourceArn}`);
            try {
                // List recovery points for this specific resource, sorted by creation date descending
                const listCmd = `aws backup list-recovery-points-by-resource --resource-arn ${constructedResourceArn} --query "RecoveryPoints | sort_by(@, &CreationDate) | [-1].RecoveryPointArn" --output text --profile ${PROFILE} --region ${REGION}`;
                
                const { stdout: latestArn } = await execPromise(listCmd);
                const freshArn = latestArn.trim();
                
                if (freshArn && freshArn !== 'None') {
                    targetAmiId = freshArn.split('/').pop();
                    console.log(`Found Latest Recovery Point via ResourceArn: ${targetAmiId}`);
                } else {
                    console.warn(`No recovery points found for resource: ${constructedResourceArn}`);
                }
            } catch (e) {
                console.warn('Failed to fetch latest by ResourceArn, falling back to provided ARN', e.message);
            }
        } else {
             console.warn('No ResourceArn provided. Skipping latest recovery point lookup.');
        }

        // Priority 2: Use provided recoveryPointArn if fresh lookup failed or wasn't attempted
        if (!targetAmiId && recoveryPointArn) {
            targetAmiId = recoveryPointArn.split('/').pop();
            console.log(`Using provided Recovery Point ARN: ${targetAmiId}`);
        }

        if (targetAmiId) {
            // Pre-check: Verify AMI exists
            const checkAmiCmd = `aws ec2 describe-images --image-ids ${targetAmiId} --profile ${PROFILE} --region ${REGION} --output json`;
            try {
                const { stdout: amiStdout } = await execPromise(checkAmiCmd);
                const amiData = JSON.parse(amiStdout);
                if (!amiData.Images || amiData.Images.length === 0) {
                     return NextResponse.json({ success: false, message: `AMI ID ${targetAmiId} not found. Launch failed.` }, { status: 404 });
                }
            } catch (amiError) {
                console.error('AMI Check Failed:', amiError.message);
                // If it fails (e.g. InvalidAMIID.NotFound), catch it here
                return NextResponse.json({ success: false, message: `AMI ID ${targetAmiId} does not exist or is invalid.` }, { status: 400 });
            }

            runInstanceCmd = `aws ec2 run-instances \\
                --image-id ${targetAmiId} \\
                --count 1 \\
                --instance-type t3.micro \\
                --key-name jventures-uat \\
                --security-group-ids ${SG_ID} \\
                --subnet-id ${SUBNET_ID} \\
                --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${instanceName}-Restore}]" \\
                --query "Instances[0].[InstanceId,PrivateIpAddress]" \\
                --output text \\
                --profile ${PROFILE} \\
                --region ${REGION}`;

        } else {
            // Fallback logic: Find snapshot by name (Old implementation)
            const findSnapshotCmd = `aws ec2 describe-snapshots --filters "Name=tag:Name,Values=${instanceName}" --query "Snapshots | sort_by(@, &StartTime) | [-1].SnapshotId" --output text --profile ${PROFILE} --region ${REGION}`;

            console.log(`Searching snapshot for ${instanceName}...`);
            const { stdout: snapshotStdout } = await execPromise(findSnapshotCmd);
            const snapshotId = snapshotStdout.trim();

            if (!snapshotId || snapshotId === 'None') {
                return NextResponse.json({ success: false, message: `No snapshot found for instance: ${instanceName}` }, { status: 404 });
            }

            console.log(`Found Latest Snapshot: ${snapshotId}`);

            // Launch Instance from Snapshot
            const BASE_AMI = 'ami-0d2042c6feb606ae9';

            runInstanceCmd = `aws ec2 run-instances \\
                --image-id ${BASE_AMI} \\
                --count 1 \\
                --instance-type t3.micro \\
                --key-name jventures-uat \\
                --security-group-ids ${SG_ID} \\
                --subnet-id ${SUBNET_ID} \\
                --block-device-mappings "[{\\"DeviceName\\":\\"/dev/sda1\\",\\"Ebs\\":{\\"SnapshotId\\":\\"${snapshotId}\\",\\"DeleteOnTermination\\":true,\\"VolumeType\\":\\"gp3\\"}}]" \\
                --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${instanceName}-Restore}]" \\
                --query "Instances[0].[InstanceId,PrivateIpAddress]" \\
                --output text \\
                --profile ${PROFILE} \\
                --region ${REGION}`;
        }

        console.log(`Launching Instance...`);
        const { stdout: launchStdout } = await execPromise(runInstanceCmd);
        const [instanceId, privateIp] = launchStdout.trim().split(/\s+/);

        if (!instanceId || !privateIp) {
            throw new Error(`Failed to get instance info from launch command. Stdout: ${launchStdout}`);
        }

        console.log(`Launched ${instanceId} with IP: ${privateIp}`);

        // 3. Update State File
        let stateData = {};
        if (fs.existsSync(STATE_FILE)) {
            try {
                const fileContent = fs.readFileSync(STATE_FILE, 'utf-8');
                stateData = JSON.parse(fileContent);
            } catch (e) {
                console.warn('Error reading state file, starting fresh', e);
            }
        }

        stateData[instanceName] = { instanceId, privateIp }; // Store both
        fs.writeFileSync(STATE_FILE, JSON.stringify(stateData, null, 2));

        return NextResponse.json({
            success: true,
            message: `Restored successfully. ID: ${instanceId}, IP: ${privateIp}`,
            instanceId: instanceId,
            privateIp: privateIp
        });

    } catch (error) {
        console.error('Restore Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function GET() {
    // Return the state for frontend refresh
    if (fs.existsSync(STATE_FILE)) {
        try {
            const data = fs.readFileSync(STATE_FILE, 'utf-8');
            return NextResponse.json(JSON.parse(data));
        } catch (e) {
            return NextResponse.json({});
        }
    }
    return NextResponse.json({});
}

export async function DELETE(request) {
    try {
        const { instanceName, instanceId } = await request.json();

        if (!instanceName) {
            return NextResponse.json({ success: false, message: 'Instance name required' }, { status: 400 });
        }

        const PROFILE = 'aws_nonprod';
        const REGION = 'ap-southeast-1';
        let terminateId = instanceId;

        // If instanceId is not provided, try to find it from state file
        if (!terminateId && fs.existsSync(STATE_FILE)) {
            try {
                const stateData = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
                // Check if stored data is object with instanceId or just string (legacy)
                const stored = stateData[instanceName];
                if (stored && typeof stored === 'object' && stored.instanceId) {
                    terminateId = stored.instanceId;
                }
            } catch (e) {
                console.warn('Error reading state file', e);
            }
        }

        // If still not found, search by Tag as fallback
        if (!terminateId) {
            console.log(`Instance ID not provided or found in state, searching by tag for: ${instanceName}-Restore`);
            // Find Running instance with the Restore tag
            const findCmd = `aws ec2 describe-instances --filters "Name=tag:Name,Values=${instanceName}-Restore" "Name=instance-state-name,Values=running" --query "Reservations[*].Instances[*].InstanceId" --output text --profile ${PROFILE} --region ${REGION}`;
            const { stdout: findStdout } = await execPromise(findCmd);
            terminateId = findStdout.trim().split(/\s+/)[0];
        }

        if (terminateId) {
            const terminateCmd = `aws ec2 terminate-instances --instance-ids ${terminateId} --profile ${PROFILE} --region ${REGION}`;
            console.log(`Terminating Instance: ${terminateId}`);
            await execPromise(terminateCmd);
        } else {
            console.log('No running instance ID found to terminate.');
            // Proceed to clean up state file anyway just in case via name
        }

        // Update State File
        if (fs.existsSync(STATE_FILE)) {
            try {
                let stateData = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
                if (stateData[instanceName]) {
                    delete stateData[instanceName];
                    fs.writeFileSync(STATE_FILE, JSON.stringify(stateData, null, 2));
                }
            } catch (e) {
                console.error('Error updating state file during delete', e);
            }
        }

        return NextResponse.json({ success: true, message: `Terminated ${instanceName}-Restore` });

    } catch (error) {
        console.error('Terminate Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
