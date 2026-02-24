import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(request) {
    try {
        const { projectName, instanceName, instanceType = 't3.micro' } = await request.json();

        // Validate inputs
        if (!instanceName || !projectName) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields: instanceName or projectName' },
                { status: 400 }
            );
        }

        // Configuration
        const AMI_ID = 'ami-0d2042c6feb606ae9';
        const SG_ID = 'sg-027f3b82ae7853b3d';
        const SUBNET_ID = 'subnet-0abb00758262160db';
        const PROFILE = 'aws_nonprod';
        const REGION = 'ap-southeast-1';

        const createEc2Command = `aws ec2 run-instances \\
            --image-id ${AMI_ID} \\
            --count 1 \\
            --instance-type ${instanceType} \\
            --key-name jventures-uat \\
            --security-group-ids ${SG_ID} \\
            --subnet-id ${SUBNET_ID} \\
            --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=${instanceName}},{Key=Project,Value=${projectName}}]' \\
            --region ap-southeast-1 \\
            --profile ${PROFILE} \\
            --output json`;

        console.log(`Executing EC2 Creation: ${createEc2Command}`);
        const { stdout, stderr } = await execPromise(createEc2Command);

        if (stderr) {
            console.error('AWS CLI stderr:', stderr);
        }

        const awsData = JSON.parse(stdout);
        const instanceId = awsData.Instances?.[0]?.InstanceId;
        const privateIp = awsData.Instances?.[0]?.PrivateIpAddress;

        return NextResponse.json({
            success: true,
            message: `EC2 Instance creation initiated successfully. Instance ID: ${instanceId}, Private IP: ${privateIp}`,
            details: {
                instanceId: instanceId,
                instanceName: instanceName,
                privateIp: privateIp,
                launchTime: awsData.Instances?.[0]?.LaunchTime,
                output: awsData
            }
        });

    } catch (error) {
        console.error('Execution Failed:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Command execution failed: ' + error.message,
                command: error.cmd
            },
            { status: 500 }
        );
    }
}
