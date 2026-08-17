import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import util from 'util';

const execFilePromise = util.promisify(execFile);

const DEFAULT_REGION = process.env.AWS_NONPROD_CREATEEC2_REGION || 'ap-southeast-1';
const DEFAULT_PROFILE = process.env.AWS_NONPROD_PROFILE || 'aws_nonprod';

function buildAwsEnv(profile) {
    const env = { ...process.env };

    if (profile) {
        env.AWS_PROFILE = profile;
    }

    return env;
}

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
        const AMI_ID = 'ami-0565b1f55647e113f';
        const SG_ID = 'sg-027f3b82ae7853b3d';
        const SUBNET_ID = 'subnet-0abb00758262160db';
        const PROFILE = DEFAULT_PROFILE;
        const REGION = DEFAULT_REGION;
        const createEc2Args = [
            'ec2',
            'run-instances',
            '--image-id',
            AMI_ID,
            '--count',
            '1',
            '--instance-type',
            instanceType,
            '--key-name',
            'jventures-uat',
            '--security-group-ids',
            SG_ID,
            '--subnet-id',
            SUBNET_ID,
            '--tag-specifications',
            `ResourceType=instance,Tags=[{Key=Name,Value=${instanceName}},{Key=Project,Value=${projectName}}]`,
            '--region',
            REGION,
            '--output',
            'json'
        ];

        console.log('Executing EC2 Creation:', { profile: PROFILE, region: REGION, args: createEc2Args });
        const { stdout, stderr } = await execFilePromise('aws', createEc2Args, {
            env: buildAwsEnv(PROFILE),
            maxBuffer: 1024 * 1024 * 10
        });

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
