import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const SAFE_TEXT_PATTERN = /^[a-zA-Z0-9._-]+$/;

function isSafeText(value) {
    return typeof value === 'string' && SAFE_TEXT_PATTERN.test(value);
}

export async function POST(request) {
    try {
        const { projectName, instanceName, instanceType = 't3.micro' } = await request.json();

        if (!instanceName || !projectName) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields: instanceName or projectName' },
                { status: 400 }
            );
        }

        if (!isSafeText(projectName) || !isSafeText(instanceName) || !isSafeText(instanceType)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid input format. Use only letters, numbers, dot (.), dash (-), or underscore (_).'
                },
                { status: 400 }
            );
        }

        const AMI_ID = 'ami-0ed30e8b2125a02ca';
        const SG_ID = 'sg-095da6c8cb4a23a70';
        const PROFILE = 'aws_prod';
        const REGION = 'ap-southeast-1';

        const createEc2Command = `aws ec2 run-instances \\
            --image-id ${AMI_ID} \\
            --count 1 \\
            --instance-type ${instanceType} \\
            --key-name jventures-uat \\
            --security-group-ids ${SG_ID} \\
            --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=${instanceName}},{Key=Project,Value=${projectName}}]' \\
            --region ${REGION} \\
            --profile ${PROFILE} \\
            --output json`;

        const { stdout, stderr } = await execPromise(createEc2Command);

        if (stderr) {
            console.error('AWS CLI stderr:', stderr);
        }

        const awsData = JSON.parse(stdout);
        const instance = awsData.Instances?.[0] || null;
        const instanceId = instance?.InstanceId;
        const privateIp = instance?.PrivateIpAddress;

        return NextResponse.json({
            success: true,
            message: `EC2 Instance creation initiated successfully. Instance ID: ${instanceId}, Private IP: ${privateIp}`,
            details: {
                instanceId,
                instanceName,
                privateIp,
                launchTime: instance?.LaunchTime,
                output: awsData
            }
        });
    } catch (error) {
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
