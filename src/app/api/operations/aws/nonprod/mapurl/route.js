import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(request) {
    try {
        const { fqdn, destinationIp, destinationPort, notes } = await request.json();

        // Validate inputs
        if (!fqdn || !destinationIp || !destinationPort) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Parse FQDN to separate domain and path
        let domain = fqdn;
        let path = '/';

        // Handle input like "olympusx-jaeger-dashboard.jventures.co.th/path1"
        const firstSlashIndex = fqdn.indexOf('/');
        if (firstSlashIndex !== -1) {
            domain = fqdn.substring(0, firstSlashIndex);
            path = fqdn.substring(firstSlashIndex);
        }

        const serviceName = `svc_${domain}`;
        const routeName = `route_${domain}`;

        // 1. Create Service Command
        const targetUrl = `http://${destinationIp}:${destinationPort}${path}`;
        const createServiceCommand = `curl -s -i -X POST https://kong-admin-uat.jfin.network/services --data name=${serviceName} --data url='${targetUrl}'`;

        // 2. Create Route Command
        const createRouteCommand = `curl -s -i -X POST https://kong-admin-uat.jfin.network/services/${serviceName}/routes --data "hosts[]=${domain}" --data "paths[]=${path}" --data "preserve_host=true" --data "name=${routeName}"`;

        try {
            console.log(`Executing Service Creation: ${createServiceCommand}`);
            const serviceExec = await execPromise(createServiceCommand);
            console.log(`Service Creation Output: ${serviceExec.stdout}`);

            console.log(`Executing Route Creation: ${createRouteCommand}`);
            const routeExec = await execPromise(createRouteCommand);
            console.log(`Route Creation Output: ${routeExec.stdout}`);

            // Combine outputs
            const combinedOutput = `Service Output:\n${serviceExec.stdout}\n\nRoute Output:\n${routeExec.stdout}`;
            const combinedCommand = `${createServiceCommand}\n\n${createRouteCommand}`;

            return NextResponse.json({
                success: true,
                message: 'Map URL request processed successfully.',
                details: {
                    id: 'REQ-' + Math.floor(Math.random() * 10000),
                    status: 'Commands Executed',
                    timestamp: new Date().toLocaleString(),
                    generatedCommand: combinedCommand,
                    output: combinedOutput,
                    notes: notes || '-'
                }
            });
        } catch (execError) {
            console.error('Execution Failed:', execError);
            return NextResponse.json({
                success: false,
                message: 'Command execution failed: ' + execError.message,
                command: execError.cmd
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Execution Failed:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'An error occurred processing the request: ' + error.message,
                command: error.cmd
            },
            { status: 500 }
        );
    }
}
