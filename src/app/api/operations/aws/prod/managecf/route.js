import { NextResponse } from 'next/server';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const DEFAULT_TARGET_IP = '18.142.134.175';

function normalizeHostname(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    const trimmed = input.trim();
    if (!trimmed) {
        return '';
    }

    try {
        const candidate = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
        const parsedUrl = new URL(candidate);
        return parsedUrl.hostname.toLowerCase().replace(/\.$/, '');
    } catch {
        return trimmed
            .replace(/^[a-z]+:\/\//i, '')
            .split('/')[0]
            .toLowerCase()
            .replace(/\.$/, '');
    }
}

function isValidHostname(hostname) {
    return (
        Boolean(hostname) &&
        hostname.length <= 253 &&
        hostname.includes('.') &&
        /^[a-z0-9.-]+$/i.test(hostname) &&
        !hostname.startsWith('.') &&
        !hostname.endsWith('.') &&
        !hostname.includes('..')
    );
}

function findBestMatchingZone(zones, hostname) {
    return [...zones]
        .filter((zone) => hostname === zone.name || hostname.endsWith(`.${zone.name}`))
        .sort((left, right) => right.name.length - left.name.length)[0];
}

async function cloudflareRequest(path, { method = 'GET', body } = {}) {
    const apiToken = process.env.CF_API_TOKEN;

    if (!apiToken) {
        throw new Error('CF_API_TOKEN is not configured on the server');
    }

    const response = await fetch(`${CLOUDFLARE_API_BASE}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
        const errorMessage = Array.isArray(data?.errors) && data.errors.length > 0
            ? data.errors.map((item) => item.message || JSON.stringify(item)).join('; ')
            : data?.message || `Cloudflare API request failed with status ${response.status}`;

        throw new Error(errorMessage);
    }

    return data;
}

export async function POST(request) {
    try {
        const { fqdn, proxied = true } = await request.json();
        const hostname = normalizeHostname(fqdn);

        if (!isValidHostname(hostname)) {
            return NextResponse.json(
                { success: false, message: 'Invalid FQDN. Please provide a valid hostname.' },
                { status: 400 }
            );
        }

        const zonesResponse = await cloudflareRequest('/zones?status=active&per_page=100');
        const zone = findBestMatchingZone(zonesResponse.result || [], hostname);

        if (!zone) {
            return NextResponse.json(
                { success: false, message: `No Cloudflare zone found for hostname: ${hostname}` },
                { status: 404 }
            );
        }

        const dnsLookupResponse = await cloudflareRequest(
            `/zones/${zone.id}/dns_records?name=${encodeURIComponent(hostname)}&per_page=100`
        );

        const existingRecord = (dnsLookupResponse.result || []).find(
            (record) => record.name?.toLowerCase() === hostname
        );

        if (existingRecord && existingRecord.type !== 'A') {
            return NextResponse.json(
                {
                    success: false,
                    message: `Existing record for ${hostname} is type ${existingRecord.type}. Please remove or change it before creating an A record.`
                },
                { status: 409 }
            );
        }

        let action = 'created';
        let record = existingRecord || null;

        if (existingRecord) {
            const alreadyConfigured =
                existingRecord.content === DEFAULT_TARGET_IP &&
                Boolean(existingRecord.proxied) === Boolean(proxied);

            if (alreadyConfigured) {
                action = 'unchanged';
            } else {
                const updateResponse = await cloudflareRequest(
                    `/zones/${zone.id}/dns_records/${existingRecord.id}`,
                    {
                        method: 'PATCH',
                        body: {
                            type: 'A',
                            name: hostname,
                            content: DEFAULT_TARGET_IP,
                            ttl: 1,
                            proxied: Boolean(proxied),
                            comment: 'Managed by IT Portal v2',
                        },
                    }
                );

                record = updateResponse.result;
                action = 'updated';
            }
        } else {
            const createResponse = await cloudflareRequest(`/zones/${zone.id}/dns_records`, {
                method: 'POST',
                body: {
                    type: 'A',
                    name: hostname,
                    content: DEFAULT_TARGET_IP,
                    ttl: 1,
                    proxied: Boolean(proxied),
                    comment: 'Managed by IT Portal v2',
                },
            });

            record = createResponse.result;
        }

        const actionLabel = action === 'created'
            ? 'Created in Cloudflare'
            : action === 'updated'
                ? 'Updated in Cloudflare'
                : 'Already Configured';

        return NextResponse.json({
            success: true,
            message: action === 'created'
                ? `Cloudflare DNS record created for ${hostname}`
                : action === 'updated'
                    ? `Cloudflare DNS record updated for ${hostname}`
                    : `Cloudflare DNS record already configured for ${hostname}`,
            details: {
                id: `CF-${Date.now()}`,
                status: actionLabel,
                action,
                hostname,
                zoneId: zone.id,
                zoneName: zone.name,
                recordId: record?.id || existingRecord?.id || '-',
                recordType: 'A',
                content: DEFAULT_TARGET_IP,
                proxied: Boolean(proxied),
                timestamp: new Date().toLocaleString(),
            },
        });
    } catch (error) {
        console.error('Cloudflare DNS request failed:', error);
        return NextResponse.json(
            {
                success: false,
                message: `Cloudflare DNS request failed: ${error.message}`,
            },
            { status: 500 }
        );
    }
}
