import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const TARGET_ZONES = ['jventures.co.th', 'jfin.network'];
const OUTPUT_JSON = 'cloudflare_non_proxied_records.json';
const OUTPUT_MD = 'cloudflare_non_proxied_records.md';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

async function cloudflareRequest(apiToken, requestPath) {
    const response = await fetch(`${CLOUDFLARE_API_BASE}${requestPath}`, {
        headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
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

async function getZoneByName(apiToken, zoneName) {
    const response = await cloudflareRequest(
        apiToken,
        `/zones?name=${encodeURIComponent(zoneName)}&status=active&per_page=1`
    );

    const zone = (response.result || [])[0];

    if (!zone || zone.name !== zoneName) {
        throw new Error(`Cloudflare zone not found: ${zoneName}`);
    }

    return zone;
}

async function getAllDnsRecords(apiToken, zoneId) {
    const records = [];
    let currentPage = 1;
    let totalPages = 1;

    while (currentPage <= totalPages) {
        const response = await cloudflareRequest(
            apiToken,
            `/zones/${zoneId}/dns_records?per_page=100&page=${currentPage}`
        );

        records.push(...(response.result || []));

        totalPages = response.result_info?.total_pages || currentPage;
        currentPage += 1;
    }

    return records;
}

function pickRecordFields(zoneName, record) {
    return {
        zone: zoneName,
        name: record.name || '',
        type: record.type || '',
        content: record.content || '',
        proxied: record.proxied,
        ttl: record.ttl,
        comment: record.comment || '',
        id: record.id || '',
    };
}

function toMarkdown(report) {
    const lines = [
        '# Cloudflare DNS Records with Proxy Disabled',
        '',
        `Generated at: ${report.generatedAt}`,
        '',
    ];

    for (const zoneSummary of report.zones) {
        lines.push(`## Zone: ${zoneSummary.zone}`);
        lines.push('');
        lines.push(`- Total records scanned: ${zoneSummary.totalRecords}`);
        lines.push(`- Records with proxied=false: ${zoneSummary.nonProxiedRecords.length}`);
        lines.push('');

        if (zoneSummary.nonProxiedRecords.length === 0) {
            lines.push('No records found with proxied=false.');
            lines.push('');
            continue;
        }

        lines.push('| Name | Type | Content | Proxied | TTL | Comment |');
        lines.push('| --- | --- | --- | --- | --- | --- |');

        for (const record of zoneSummary.nonProxiedRecords) {
            lines.push(
                `| ${record.name} | ${record.type} | ${String(record.content).replace(/\|/g, '\\|')} | ${record.proxied} | ${record.ttl} | ${String(record.comment).replace(/\|/g, '\\|')} |`
            );
        }

        lines.push('');
    }

    return `${lines.join('\n')}\n`;
}

async function main() {
    const apiToken = process.env.CF_API_TOKEN;

    if (!apiToken) {
        throw new Error('CF_API_TOKEN is not configured in the current environment');
    }

    const generatedAt = new Date().toISOString();
    const zones = [];

    for (const zoneName of TARGET_ZONES) {
        const zone = await getZoneByName(apiToken, zoneName);
        const allRecords = await getAllDnsRecords(apiToken, zone.id);
        const nonProxiedRecords = allRecords
            .filter((record) => record.proxied === false)
            .map((record) => pickRecordFields(zone.name, record))
            .sort((left, right) => {
                if (left.name === right.name) {
                    return left.type.localeCompare(right.type);
                }

                return left.name.localeCompare(right.name);
            });

        zones.push({
            zone: zone.name,
            zoneId: zone.id,
            totalRecords: allRecords.length,
            nonProxiedRecords,
        });
    }

    const report = {
        generatedAt,
        zones,
    };

    await writeFile(
        path.join(currentDir, OUTPUT_JSON),
        `${JSON.stringify(report, null, 2)}\n`,
        'utf8'
    );

    await writeFile(path.join(currentDir, OUTPUT_MD), toMarkdown(report), 'utf8');

    for (const zoneSummary of zones) {
        console.log(
            `${zoneSummary.zone}: scanned ${zoneSummary.totalRecords} records, found ${zoneSummary.nonProxiedRecords.length} records with proxied=false`
        );
    }

    console.log(`Wrote ${OUTPUT_JSON} and ${OUTPUT_MD} in ${currentDir}`);
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});