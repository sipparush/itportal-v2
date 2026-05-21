import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const TARGET_ZONES = ['jventures.co.th', 'jfin.network'];
const INPUT_FILE = 'list_to_enable_proxy.md';
const OUTPUT_SUMMARY_MD = 'enable_proxy_summary.md';
const OUTPUT_SUMMARY_JSON = 'enable_proxy_summary.json';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

async function cloudflareRequest(apiToken, requestPath, { method = 'GET', body } = {}) {
    const response = await fetch(`${CLOUDFLARE_API_BASE}${requestPath}`, {
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

function detectZoneName(recordName) {
    return [...TARGET_ZONES]
        .sort((left, right) => right.length - left.length)
        .find((zoneName) => recordName === zoneName || recordName.endsWith(`.${zoneName}`)) || null;
}

function parseMarkdownTable(input) {
    return input
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('|') && line.endsWith('|'))
        .map((line) => line.split('|').slice(1, -1).map((part) => part.trim()))
        .filter((columns) => columns.length >= 6)
        .filter((columns) => columns[0] && columns[0] !== 'Name' && !/^---+$/.test(columns[0]))
        .map((columns) => ({
            name: columns[0],
            type: columns[1],
            content: columns[2],
            proxied: columns[3],
            ttl: columns[4],
            comment: columns[5],
        }));
}

async function getZonesByName(apiToken) {
    const zoneEntries = await Promise.all(
        TARGET_ZONES.map(async (zoneName) => {
            const response = await cloudflareRequest(
                apiToken,
                `/zones?name=${encodeURIComponent(zoneName)}&status=active&per_page=1`
            );

            const zone = (response.result || [])[0];

            if (!zone || zone.name !== zoneName) {
                throw new Error(`Cloudflare zone not found: ${zoneName}`);
            }

            return [zoneName, zone];
        })
    );

    return new Map(zoneEntries);
}

async function findMatchingRecord(apiToken, zoneId, targetRecord) {
    const response = await cloudflareRequest(
        apiToken,
        `/zones/${zoneId}/dns_records?name=${encodeURIComponent(targetRecord.name)}&type=${encodeURIComponent(targetRecord.type)}&per_page=100`
    );

    const candidates = (response.result || []).filter((record) => {
        return record.name === targetRecord.name &&
            record.type === targetRecord.type &&
            String(record.content || '') === targetRecord.content;
    });

    if (candidates.length === 1) {
        return candidates[0];
    }

    if (candidates.length > 1) {
        throw new Error('Multiple matching records found');
    }

    return null;
}

async function enableProxy(apiToken, zoneId, record) {
    const response = await cloudflareRequest(apiToken, `/zones/${zoneId}/dns_records/${record.id}`, {
        method: 'PATCH',
        body: {
            proxied: true,
        },
    });

    return response.result;
}

function summarizeCounts(items) {
    return items.reduce((result, item) => {
        result[item.status] = (result[item.status] || 0) + 1;
        return result;
    }, {});
}

function toMarkdown(summary) {
    const counts = summarizeCounts(summary.results);
    const lines = [
        '# Cloudflare Enable Proxy Summary',
        '',
        `Generated at: ${summary.generatedAt}`,
        `Source file: ${summary.sourceFile}`,
        `Total input rows: ${summary.totalInputRows}`,
        `Updated: ${counts.updated || 0}`,
        `Already enabled: ${counts.already_enabled || 0}`,
        `Skipped: ${counts.skipped || 0}`,
        `Failed: ${counts.failed || 0}`,
        '',
        '| Name | Zone | Type | Content | Status | Message |',
        '| --- | --- | --- | --- | --- | --- |',
    ];

    for (const item of summary.results) {
        lines.push(
            `| ${item.name} | ${item.zone || ''} | ${item.type} | ${String(item.content).replace(/\|/g, '\\|')} | ${item.status} | ${String(item.message || '').replace(/\|/g, '\\|')} |`
        );
    }

    lines.push('');
    return `${lines.join('\n')}\n`;
}

async function main() {
    const apiToken = process.env.CF_API_TOKEN;

    if (!apiToken) {
        throw new Error('CF_API_TOKEN is not configured in the current environment');
    }

    const sourceFile = path.join(currentDir, INPUT_FILE);
    const input = await readFile(sourceFile, 'utf8');
    const parsedRows = parseMarkdownTable(input);
    const zonesByName = await getZonesByName(apiToken);
    const results = [];

    for (const row of parsedRows) {
        const zoneName = detectZoneName(row.name);

        if (!zoneName) {
            results.push({
                ...row,
                zone: null,
                status: 'skipped',
                message: 'No matching target zone found for record name',
            });
            continue;
        }

        const zone = zonesByName.get(zoneName);

        try {
            const matchingRecord = await findMatchingRecord(apiToken, zone.id, row);

            if (!matchingRecord) {
                results.push({
                    ...row,
                    zone: zone.name,
                    status: 'failed',
                    message: 'Matching record not found in Cloudflare',
                });
                continue;
            }

            if (matchingRecord.proxied === true) {
                results.push({
                    ...row,
                    zone: zone.name,
                    recordId: matchingRecord.id,
                    status: 'already_enabled',
                    message: 'Proxy already enabled',
                });
                continue;
            }

            const updatedRecord = await enableProxy(apiToken, zone.id, matchingRecord);

            results.push({
                ...row,
                zone: zone.name,
                recordId: updatedRecord.id,
                status: 'updated',
                message: 'Proxy enabled successfully',
            });
        } catch (error) {
            results.push({
                ...row,
                zone: zone.name,
                status: 'failed',
                message: error.message,
            });
        }
    }

    const summary = {
        generatedAt: new Date().toISOString(),
        sourceFile: INPUT_FILE,
        totalInputRows: parsedRows.length,
        counts: summarizeCounts(results),
        results,
    };

    await writeFile(
        path.join(currentDir, OUTPUT_SUMMARY_JSON),
        `${JSON.stringify(summary, null, 2)}\n`,
        'utf8'
    );

    await writeFile(path.join(currentDir, OUTPUT_SUMMARY_MD), toMarkdown(summary), 'utf8');

    console.log(`Processed ${parsedRows.length} rows from ${INPUT_FILE}`);
    console.log(`Updated: ${summary.counts.updated || 0}`);
    console.log(`Already enabled: ${summary.counts.already_enabled || 0}`);
    console.log(`Skipped: ${summary.counts.skipped || 0}`);
    console.log(`Failed: ${summary.counts.failed || 0}`);
    console.log(`Wrote ${OUTPUT_SUMMARY_JSON} and ${OUTPUT_SUMMARY_MD} in ${currentDir}`);
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});