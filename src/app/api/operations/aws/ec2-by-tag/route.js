import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import util from 'util';

const execFilePromise = util.promisify(execFile);
const DEFAULT_REGION = process.env.AWS_EC2_TAG_SEARCH_REGION || 'ap-southeast-1';

const ENVIRONMENTS = [
    {
        key: 'prod',
        label: 'Production',
        profile: process.env.AWS_PROD_PROFILE || 'aws_prod'
    },
    {
        key: 'nonprod',
        label: 'Non-Production',
        profile: process.env.AWS_NONPROD_PROFILE || 'aws_nonprod'
    }
];

function normalizeTagValue(value) {
    return String(value || '').trim();
}

function buildAwsEnv(profile) {
    const env = { ...process.env };

    if (profile) {
        env.AWS_PROFILE = profile;
    }

    return env;
}

async function describeInstancesByTag({ profile, region, tagValue }) {
    const args = [
        'ec2',
        'describe-instances',
        '--filters',
        `Name=tag:project,Values=*${tagValue}*`,
        'Name=instance-state-name,Values=running,stopped,pending,stopping',
        '--region',
        region,
        '--output',
        'json'
    ];

    const { stdout, stderr } = await execFilePromise('aws', args, {
        env: buildAwsEnv(profile),
        maxBuffer: 1024 * 1024 * 10
    });

    if (stderr) {
        console.warn(`AWS CLI stderr for profile ${profile}:`, stderr);
    }

    return JSON.parse(stdout || '{}');
}

function mapReservations(environment, payload) {
    const reservations = payload?.Reservations || [];

    return reservations.flatMap((reservation) => {
        const instances = reservation?.Instances || [];

        return instances.map((instance) => {
            const tags = Object.fromEntries((instance.Tags || []).map((tag) => [tag.Key, tag.Value]));

            return {
                environment: environment.key,
                environmentLabel: environment.label,
                profile: environment.profile,
                instanceId: instance.InstanceId || '-',
                name: tags.Name || '-',
                project: tags.project || '-',
                state: instance.State?.Name || '-',
                instanceType: instance.InstanceType || '-',
                availabilityZone: instance.Placement?.AvailabilityZone || '-',
                privateIp: instance.PrivateIpAddress || '-',
                publicIp: instance.PublicIpAddress || '-',
                tags
            };
        });
    });
}

export async function POST(request) {
    try {
        const body = await request.json();
        const tagValue = normalizeTagValue(body?.tagValue);
        const region = normalizeTagValue(body?.region) || DEFAULT_REGION;

        if (!tagValue) {
            return NextResponse.json({ success: false, message: 'tagValue is required' }, { status: 400 });
        }

        const environmentResults = await Promise.all(ENVIRONMENTS.map(async (environment) => {
            const payload = await describeInstancesByTag({
                profile: environment.profile,
                region,
                tagValue
            });

            return {
                environment: environment.key,
                environmentLabel: environment.label,
                profile: environment.profile,
                instances: mapReservations(environment, payload)
            };
        }));

        const results = environmentResults.flatMap((item) => item.instances);

        return NextResponse.json({
            success: true,
            tagValue,
            region,
            total: results.length,
            environments: environmentResults,
            results
        });
    } catch (error) {
        console.error('EC2 by tag search failed:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'EC2 by tag search failed'
        }, { status: 500 });
    }
}