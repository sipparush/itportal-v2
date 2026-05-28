import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function POST(req) {
    try {
        const { instanceId, ip } = await req.json();
        if (!instanceId && !ip) {
            return NextResponse.json({ success: false, message: 'instanceId or ip is required' }, { status: 400 });
        }

        // ลบ record จาก scan_security_patch ตาม instanceId หรือ ip
        let result;
        if (instanceId) {
            result = await query('DELETE FROM scan_security_patch WHERE instance_id = $1', [instanceId]);
        } else {
            result = await query('DELETE FROM scan_security_patch WHERE ip = $1', [ip]);
        }

        return NextResponse.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
