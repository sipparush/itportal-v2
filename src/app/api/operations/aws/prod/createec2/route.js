import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import util from 'util';

const execFilePromise = util.promisify(execFile);

const SAFE_TEXT_PATTERN = /^[a-zA-Z0-9._-]+$/;

function isSafeText(value) {
    return typeof value === 'string' && SAFE_TEXT_PATTERN.test(value);
}

async function runAwsCli(args) {
    const { stdout, stderr } = await execFilePromise('aws', args, { maxBuffer: 10 * 1024 * 1024 });
    if (stderr) {
        console.error('AWS CLI stderr:', stderr);
    }
    return stdout;
}

export async function POST(request) {
    let createdSecurityGroupId = null;
    let createdSecurityGroupName = null;

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
        const SOURCE_SG_ID = 'sg-0c3b54853be3ac21e';
        const SUBNET_ID = 'subnet-0ce756ed09bd7abe5';
        const PROFILE = 'aws_prod';
        const REGION = 'ap-southeast-1';
        const KEY_NAME = 'jventures-prod';

        const subnetRaw = await runAwsCli([
            'ec2',
            'describe-subnets',
            '--subnet-ids',
            SUBNET_ID,
            '--region',
            REGION,
            '--profile',
            PROFILE,
            '--output',
            'json'
        ]);

        const subnetData = JSON.parse(subnetRaw);
        const vpcId = subnetData?.Subnets?.[0]?.VpcId;

        if (!vpcId) {
            throw new Error(`Subnet not found or VPC not resolvable: ${SUBNET_ID}`);
        }

        createdSecurityGroupName = `${instanceName}-sg`;

        let createSgRaw;
        try {
            createSgRaw = await runAwsCli([
                'ec2',
                'create-security-group',
                '--group-name',
                createdSecurityGroupName,
                '--description',
                `Auto-created SG for ${instanceName}`,
                '--vpc-id',
                vpcId,
                '--region',
                REGION,
                '--profile',
                PROFILE,
                '--output',
                'json'
            ]);
        } catch (error) {
            if (error?.stderr?.includes('InvalidGroup.Duplicate')) {
                return NextResponse.json(
                    {
                        success: false,
                        message: `Security Group name already exists: ${createdSecurityGroupName}. Please use a different instance name.`
                    },
                    { status: 409 }
                );
            }
            throw error;
        }

        const createSgData = JSON.parse(createSgRaw);
        createdSecurityGroupId = createSgData?.GroupId;

        if (!createdSecurityGroupId) {
            throw new Error('Failed to create security group: missing GroupId');
        }

        const sourceSgRaw = await runAwsCli([
            'ec2',
            'describe-security-groups',
            '--group-ids',
            SOURCE_SG_ID,
            '--region',
            REGION,
            '--profile',
            PROFILE,
            '--output',
            'json'
        ]);

        const sourceSgData = JSON.parse(sourceSgRaw);
        const sourceSecurityGroup = sourceSgData?.SecurityGroups?.[0];

        if (!sourceSecurityGroup) {
            throw new Error(`Source Security Group not found: ${SOURCE_SG_ID}`);
        }

        const ingressPermissions = sourceSecurityGroup.IpPermissions || [];
        const egressPermissions = sourceSecurityGroup.IpPermissionsEgress || [];

        const newSgRaw = await runAwsCli([
            'ec2',
            'describe-security-groups',
            '--group-ids',
            createdSecurityGroupId,
            '--region',
            REGION,
            '--profile',
            PROFILE,
            '--output',
            'json'
        ]);

        const newSgData = JSON.parse(newSgRaw);
        const defaultEgressPermissions = newSgData?.SecurityGroups?.[0]?.IpPermissionsEgress || [];

        if (defaultEgressPermissions.length > 0) {
            await runAwsCli([
                'ec2',
                'revoke-security-group-egress',
                '--group-id',
                createdSecurityGroupId,
                '--ip-permissions',
                JSON.stringify(defaultEgressPermissions),
                '--region',
                REGION,
                '--profile',
                PROFILE,
                '--output',
                'json'
            ]);
        }

        if (ingressPermissions.length > 0) {
            await runAwsCli([
                'ec2',
                'authorize-security-group-ingress',
                '--group-id',
                createdSecurityGroupId,
                '--ip-permissions',
                JSON.stringify(ingressPermissions),
                '--region',
                REGION,
                '--profile',
                PROFILE,
                '--output',
                'json'
            ]);
        }

        if (egressPermissions.length > 0) {
            await runAwsCli([
                'ec2',
                'authorize-security-group-egress',
                '--group-id',
                createdSecurityGroupId,
                '--ip-permissions',
                JSON.stringify(egressPermissions),
                '--region',
                REGION,
                '--profile',
                PROFILE,
                '--output',
                'json'
            ]);
        }

        const ec2Raw = await runAwsCli([
            'ec2',
            'run-instances',
            '--image-id',
            AMI_ID,
            '--count',
            '1',
            '--instance-type',
            instanceType,
            '--key-name',
            KEY_NAME,
            '--security-group-ids',
            createdSecurityGroupId,
            '--subnet-id',
            SUBNET_ID,
            '--tag-specifications',
            `ResourceType=instance,Tags=[{Key=Name,Value=${instanceName}},{Key=Project,Value=${projectName}}]`,
            '--region',
            REGION,
            '--profile',
            PROFILE,
            '--output',
            'json'
        ]);

        const awsData = JSON.parse(ec2Raw);
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
                subnetId: SUBNET_ID,
                securityGroupId: createdSecurityGroupId,
                securityGroupName: createdSecurityGroupName,
                sourceSecurityGroupId: SOURCE_SG_ID,
                launchTime: instance?.LaunchTime,
                output: awsData
            }
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: 'Command execution failed: ' + error.message,
                command: error.cmd,
                stderr: error.stderr,
                createdSecurityGroupId,
                createdSecurityGroupName
            },
            { status: 500 }
        );
    }
}
