import { NextResponse } from 'next/server';
import { exec, execFile } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';
import { query } from '@/lib/postgres';
import * as XLSX from 'xlsx';

const execFilePromise = util.promisify(execFile);
const execPromise = util.promisify(exec);
const AWS_PROFILE = 'aws_nonprod';
const LOG_FILE = path.resolve(process.cwd(), 'scan_security_patch_nonprod.log');
const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const REMOTE_SCAN_SCRIPT = `
set -u
os_name="unknown"
os_id="unknown"
if [ -f /etc/os-release ]; then
  . /etc/os-release
  os_name="\${PRETTY_NAME:-unknown}"
  os_id="\${ID:-unknown}"
fi
kernel="$(uname -r 2>/dev/null || echo unknown)"
security_patch_version="$kernel"
latest_status="unknown"
patch_reference_date=""

case "$os_id" in
  ubuntu|debian)
    if command -v apt-get >/dev/null 2>&1; then
      pending="$(apt-get -s upgrade 2>/dev/null | awk '/^Inst / && /Security/ {count++} END {print count+0}')"
      if [ "$pending" -eq 0 ]; then
        latest_status="up-to-date"
      else
        latest_status="pending-security-updates:$pending"
      fi
    fi
    patch_reference_date="$(stat -c %y /var/lib/apt/periodic/update-success-stamp 2>/dev/null | cut -d'.' -f1 || true)"
    ;;
  amzn|rhel|centos|rocky|almalinux|fedora)
    if command -v dnf >/dev/null 2>&1; then
      pending="$(dnf -q updateinfo list security --updates 2>/dev/null | awk 'NF && $1 !~ /^Update/ {count++} END {print count+0}')"
    elif command -v yum >/dev/null 2>&1; then
      pending="$(yum -q updateinfo list security all 2>/dev/null | awk 'NF && $1 !~ /^Loaded/ {count++} END {print count+0}')"
    else
      pending="0"
    fi
    if [ "$pending" -eq 0 ]; then
      latest_status="up-to-date"
    else
      latest_status="pending-security-updates:$pending"
    fi
    patch_reference_date="$(rpm -qa --last 2>/dev/null | head -n 1 | sed 's/^[^ ]* //' || true)"
    ;;
  *)
    latest_status="unknown-os"
    ;;
esac

printf 'os_name=%s\n' "$os_name"
printf 'security_patch_version=%s\n' "$security_patch_version"
printf 'latest_status=%s\n' "$latest_status"
printf 'patch_reference_date=%s\n' "$patch_reference_date"
`;

function sanitizeLogToken(value) {
    return String(value || '-').trim().replace(/\s+/g, '_');
}

function isValidIpv4(ip) {
    return IPV4_PATTERN.test(String(ip || '').trim());
}

function parseRemoteOutput(stdout) {
    const parsed = {
        osName: 'unknown',
        securityPatchVersion: 'unknown',
        latestStatus: 'unknown',
        patchReferenceDate: ''
    };

    for (const line of stdout.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }

        const [key, ...rest] = trimmed.split('=');
        const value = rest.join('=').trim();

        if (key === 'os_name') {
            parsed.osName = value || 'unknown';
        } else if (key === 'security_patch_version') {
            parsed.securityPatchVersion = value || 'unknown';
        } else if (key === 'latest_status') {
            parsed.latestStatus = value || 'unknown';
        } else if (key === 'patch_reference_date') {
            parsed.patchReferenceDate = value;
        }
    }

    return parsed;
}

async function ensureScanSecurityPatchTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS scan_security_patch (
            instance_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            ip INET NOT NULL,
            check_date TIMESTAMPTZ NOT NULL,
            security_patch_version TEXT NOT NULL,
            latest_status TEXT NOT NULL,
            os_name TEXT,
            patch_reference_date TEXT,
            last_scan_date TIMESTAMPTZ,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
}

function mapDatabaseRow(row) {
    return {
        instanceId: row.instance_id,
        name: row.name,
        ip: row.ip,
        checkDate: row.check_date,
        securityPatchVersion: row.security_patch_version,
        latestStatus: row.latest_status,
        osName: row.os_name,
        patchReferenceDate: row.patch_reference_date,
        lastScanDate: row.last_scan_date,
        updatedAt: row.updated_at,
        createdAt: row.created_at
    };
}

async function getScanHistory(limit = 20) {
    const { rows } = await query(`
        SELECT
            instance_id,
            host(ip) AS ip,
            name,
            check_date,
            security_patch_version,
            latest_status,
            os_name,
            patch_reference_date,
            last_scan_date,
            updated_at,
            created_at
        FROM scan_security_patch
        ORDER BY updated_at DESC
        LIMIT $1
    `, [limit]);

    return rows.map(mapDatabaseRow);
}

function buildWorkbookRows(history) {
    return history.map((item) => ({
        instance_id: item.instanceId,
        name: item.name,
        ip: item.ip,
        os_name: item.osName || '',
        check_date: item.checkDate,
        last_scan_date: item.lastScanDate || '',
        patch_reference_date: item.patchReferenceDate || '',
        security_patch_version: item.securityPatchVersion,
        latest_status: item.latestStatus,
        updated_at: item.updatedAt,
        created_at: item.createdAt
    }));
}

async function upsertScanResult(scanResult) {
    await query(`
        INSERT INTO scan_security_patch (
            instance_id,
            name,
            ip,
            check_date,
            security_patch_version,
            latest_status,
            os_name,
            patch_reference_date,
            last_scan_date,
            updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (instance_id)
        DO UPDATE SET
            name = EXCLUDED.name,
            ip = EXCLUDED.ip,
            check_date = EXCLUDED.check_date,
            security_patch_version = EXCLUDED.security_patch_version,
            latest_status = EXCLUDED.latest_status,
            os_name = EXCLUDED.os_name,
            patch_reference_date = EXCLUDED.patch_reference_date,
            last_scan_date = EXCLUDED.last_scan_date,
            updated_at = NOW()
    `, [
        scanResult.instanceId,
        scanResult.name,
        scanResult.ip,
        scanResult.checkDate,
        scanResult.securityPatchVersion,
        scanResult.latestStatus,
        scanResult.osName || null,
        scanResult.patchReferenceDate || null,
        scanResult.lastScanDate || null
    ]);
}

async function appendLogLine(scanResult) {
    const line = [
        sanitizeLogToken(scanResult.instanceId),
        sanitizeLogToken(scanResult.name),
        sanitizeLogToken(scanResult.ip),
        sanitizeLogToken(scanResult.checkDate),
        sanitizeLogToken(scanResult.securityPatchVersion),
        sanitizeLogToken(scanResult.latestStatus)
    ].join(' ');

    await fs.appendFile(LOG_FILE, `${line}\n`, 'utf8');
}

async function getLastScanDate(instanceId, ip) {
    try {
        const content = await fs.readFile(LOG_FILE, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean).reverse();

        for (const line of lines) {
            const tokens = line.trim().split(/\s+/);
            if (tokens.length < 6) {
                continue;
            }

            if (tokens[0] === instanceId || tokens[2] === ip) {
                return tokens[3];
            }
        }

        return null;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }

        throw error;
    }
}

async function listRunningInstances() {
    const { stdout } = await execFilePromise('aws', [
        'ec2',
        'describe-instances',
        '--profile',
        AWS_PROFILE,
        '--filters',
        'Name=instance-state-name,Values=running',
        '--query',
        'Reservations[].Instances[].{InstanceId:InstanceId,Name:Tags[?Key==`Name`]|[0].Value,PrivateIp:PrivateIpAddress,PublicIp:PublicIpAddress}',
        '--output',
        'json'
    ]);

    const instances = JSON.parse(stdout || '[]');

    return instances.map((instance) => ({
        instanceId: instance.InstanceId || '-',
        name: instance.Name || '-',
        ip: instance.PrivateIp || instance.PublicIp || ''
    })).filter((instance) => isValidIpv4(instance.ip));
}

async function resolveInstanceByIp(ip) {
    const instances = await listRunningInstances();
    const matched = instances.find((instance) => instance.ip === ip);

    if (matched) {
        return matched;
    }

    return {
        instanceId: 'manual',
        name: 'manual-ip',
        ip
    };
}

async function runRemoteScan(target) {
    if (!isValidIpv4(target.ip)) {
        const result = {
            success: false,
            instanceId: target.instanceId,
            name: target.name,
            ip: target.ip,
            checkDate: new Date().toISOString(),
            lastScanDate: await getLastScanDate(target.instanceId, target.ip),
            osName: 'unknown',
            patchReferenceDate: null,
            securityPatchVersion: 'unknown',
            latestStatus: 'invalid-ip',
            error: 'Invalid IPv4 address'
        };

        await appendLogLine(result);
        await upsertScanResult(result);

        return result;
    }

    const checkDate = new Date().toISOString();
    const lastScanDate = await getLastScanDate(target.instanceId, target.ip);

    try {
        const sshCommand = `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ConnectTimeout=10 jventures@${target.ip} 'bash -s' <<'EOF'\n${REMOTE_SCAN_SCRIPT}\nEOF`;
        const { stdout, stderr } = await execPromise(sshCommand, { maxBuffer: 1024 * 1024 });

        const parsed = parseRemoteOutput(stdout || '');
        const result = {
            success: true,
            instanceId: target.instanceId,
            name: target.name,
            ip: target.ip,
            checkDate,
            lastScanDate,
            osName: parsed.osName,
            patchReferenceDate: parsed.patchReferenceDate || null,
            securityPatchVersion: parsed.securityPatchVersion,
            latestStatus: parsed.latestStatus,
            stderr: stderr?.trim() || ''
        };

        await appendLogLine(result);
        await upsertScanResult(result);

        return result;
    } catch (error) {
        const result = {
            success: false,
            instanceId: target.instanceId,
            name: target.name,
            ip: target.ip,
            checkDate,
            lastScanDate,
            osName: 'unknown',
            patchReferenceDate: null,
            securityPatchVersion: 'unknown',
            latestStatus: 'scan-failed',
            error: error.stderr?.trim() || error.message
        };

        await appendLogLine(result);
        await upsertScanResult(result);

        return result;
    }
}

export async function POST(request) {
    try {
        const { mode, ip } = await request.json();
        await ensureScanSecurityPatchTable();

        if (!mode || !['farm', 'ip'].includes(mode)) {
            return NextResponse.json({
                success: false,
                message: 'mode must be either "farm" or "ip"'
            }, { status: 400 });
        }

        let targets = [];

        if (mode === 'farm') {
            targets = await listRunningInstances();
        } else {
            if (!ip || !ip.trim()) {
                return NextResponse.json({
                    success: false,
                    message: 'ip is required when mode is "ip"'
                }, { status: 400 });
            }

            if (!isValidIpv4(ip.trim())) {
                return NextResponse.json({
                    success: false,
                    message: 'ip must be a valid IPv4 address'
                }, { status: 400 });
            }

            targets = [await resolveInstanceByIp(ip.trim())];
        }

        if (targets.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No target instances found for scanning'
            }, { status: 404 });
        }

        const results = [];
        for (const target of targets) {
            results.push(await runRemoteScan(target));
        }

        const successCount = results.filter((item) => item.success).length;
        const failedCount = results.length - successCount;

        return NextResponse.json({
            success: true,
            mode,
            logFile: LOG_FILE,
            summary: {
                checked: results.length,
                success: successCount,
                failed: failedCount
            },
            results
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error.message || 'Security patch scan failed'
        }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        await ensureScanSecurityPatchTable();

        const { searchParams } = new URL(request.url);
        const limitParam = Number.parseInt(searchParams.get('limit') || '20', 10);
        const limit = Number.isNaN(limitParam) ? 20 : Math.min(Math.max(limitParam, 1), 100);
        const history = await getScanHistory(limit);
        const format = searchParams.get('format');

        if (format === 'xlsx') {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(buildWorkbookRows(history));
            XLSX.utils.book_append_sheet(workbook, worksheet, 'scan_security_patch');
            const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            return new NextResponse(buffer, {
                status: 200,
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="scan_security_patch_${timestamp}.xlsx"`,
                    'Cache-Control': 'no-store'
                }
            });
        }

        return NextResponse.json({
            success: true,
            count: history.length,
            history
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to load scan history'
        }, { status: 500 });
    }
}
