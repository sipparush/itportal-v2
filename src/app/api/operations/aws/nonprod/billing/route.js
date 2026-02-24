import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month'); // e.g., '1', '2'
    const rateParam = searchParams.get('rate'); // Optional exchange rate
    const exchangeRate = rateParam ? parseFloat(rateParam) : 34.0;

    // Validate inputs
    if (!year || !month) {
        return NextResponse.json({ error: 'Year and Month are required' }, { status: 400 });
    }

    const yearInt = parseInt(year);
    const monthInt = parseInt(month);

    // Calculate dates for AWS CLI (Start=Inclusive, End=Exclusive)
    const startDate = `${yearInt}-${monthInt.toString().padStart(2, '0')}-01`;

    // Calculate End Date (First day of next month)
    let endYear = yearInt;
    let endMonth = monthInt + 1;
    if (endMonth > 12) {
        endMonth = 1;
        endYear = yearInt + 1;
    }
    const endDate = `${endYear}-${endMonth.toString().padStart(2, '0')}-01`;

    try {
        // Construct AWS Command
        // Note: Using NetUnblendedCost as per request, grouped by TAG project
        const command = `aws ce get-cost-and-usage \
            --time-period Start=${startDate},End=${endDate} \
            --granularity MONTHLY \
            --metrics NetUnblendedCost \
            --group-by Type=TAG,Key=project \
            --filter '{"Not":{"Dimensions":{"Key":"RECORD_TYPE","Values":["Refund","Credit"]}}}' \
            --region us-east-1 \
            --profile aws_nonprod \
            --output json`;

        console.log(`Executing AWS Cost Command: ${command}`);

        const { stdout, stderr } = await execPromise(command);

        if (stderr) {
            console.warn('AWS CLI stderr:', stderr);
        }

        const awsData = JSON.parse(stdout);

        // Save RAW Data as requested: 2026-jan-aws-nonprod.json
        const monthNames = ["jan", "feb", "mar", "apr", "may", "jun",
            "jul", "aug", "sep", "oct", "nov", "dec"];
        const monthName = monthNames[monthInt - 1];
        const rawFileName = `${yearInt}-${monthName}-aws-nonprod.json`;
        const rawFilePath = path.join(process.cwd(), 'raw-data', rawFileName);

        try {
            fs.writeFileSync(rawFilePath, JSON.stringify(awsData, null, 2));
            console.log(`Saved raw billing data to ${rawFilePath}`);
        } catch (fileErr) {
            console.error('Failed to save raw billing data:', fileErr);
        }

        // Transform AWS Data to our frontend format
        /*
          AWS Structure:
          {
            "ResultsByTime": [
              {
                "TimePeriod": { "Start": "2026-01-01", "End": "2026-02-01" },
                "Total": {},
                "Groups": [
                  {
                    "Keys": [ "project$chg-kidd-join" ],
                    "Metrics": { "NetUnblendedCost": { "Amount": "123.45", "Unit": "USD" } }
                  }
                ]
              }
            ]
          }
        */

        const resultPeriod = awsData.ResultsByTime?.[0];
        const groups = resultPeriod?.Groups || [];

        // Exchange Rate
        const EXCHANGE_RATE = exchangeRate; // Use user provided rate or default 34.0

        const mappedItems = [];
        let totalCost = 0;

        groups.forEach(group => {
            const tagKey = group.Keys?.[0] || 'Unknown';
            const rawProjectName = tagKey.replace('project$', ''); // Remove AWS prefix
            const costAmount = parseFloat(group.Metrics?.NetUnblendedCost?.Amount || 0);

            // Parse logic: chg-kidd-join -> type: charge, pm: kidd, project: join
            const parts = rawProjectName.split('-');
            let itemType = 'unknown';
            let pmName = '';
            let realProjectName = rawProjectName;

            if (parts.length >= 3) {
                // 1st word
                const prefix = parts[0].toLowerCase();
                if (prefix === 'chg') itemType = 'charge';
                else if (prefix === 'non') itemType = 'non-charge';

                // 2nd word: PM
                pmName = parts[1];

                // 3rd word (and beyond?): Project Name
                // Requirement: 3rd word is project name. If there are more dashes, do we join them?
                // Let's assume the rest is the project name for clarity.
                realProjectName = parts.slice(2).join('-');
            } else if (!rawProjectName) {
                // Empty project name -> no-tagged
                realProjectName = "no-tagged";
            }

            // Store as USD (base currency) for frontend calculation
            // const costTHB = costAmount * EXCHANGE_RATE; // Removed backend conversion
            // totalCost += costTHB; // This would stem from USD if we don't convert

            // We will return totalCost in USD now.
            totalCost += costAmount;

            mappedItems.push({
                name: rawProjectName, // Keep original full name for ID/Tracking
                displayName: realProjectName,
                pm: pmName,
                derivedType: itemType,
                cost: costAmount // USD
            });
        });

        // Structure for frontend
        const responseData = {
            meta: {
                year: yearInt,
                month: new Date(yearInt, monthInt - 1).toLocaleString('en-US', { month: 'long' }),
                totalCost: totalCost, // USD
                currency: 'USD',
                rate: EXCHANGE_RATE,
                previousMonthCost: 0,
                percentChange: 0
            },
            groups: [
                {
                    name: 'All Projects (AWS)',
                    total: totalCost,
                    items: mappedItems
                }
            ]
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Failed to fetch AWS costs:', error);

        // Fallback to MOCK data if AWS command fails (e.g. invalid creds or permission)
        console.log('Falling back to Mock Data due to error...');

        const key = `${yearInt}-${monthInt.toString().padStart(2, '0')}`;
        const data = MOCK_DATA[key];
        if (!data) {
            return NextResponse.json({
                meta: { year: yearInt, month: monthInt, totalCost: 0, currency: 'THB' },
                groups: []
            });
        }
        return NextResponse.json(data);
    }
}


// Reconciling variable names
const MOCK_DATA = {
    '2026-02': {
        meta: {
            year: 2026,
            month: 'February',
            totalCost: 450000.00, // Estimated
            previousMonthCost: 481091.18,
            percentChange: -6.46,
            amountChange: -31091.18,
            currency: 'THB'
        },
        groups: [
            {
                name: 'non-charge-ส่วนกลาง',
                total: 70000.00,
                items: [
                    { name: 'kawari', cost: 1000.00 },
                    { name: 'infra (Server, Network, Security กลาง)', cost: 69000.00 }
                ]
            },
            {
                name: 'charge (server)',
                total: 280000.00,
                items: [
                    { name: 'casa', cost: 500.00 },
                    { name: 'crm', cost: 12000.00 },
                    // ... abbreviated for brevity in mock
                    { name: 'others', cost: 267500.00 }
                ]
            },
            {
                name: 'Non-charge (Server)',
                total: 100000.00,
                items: [
                    { name: 'acb', cost: 150.00 },
                    // ... abbreviated
                    { name: 'others', cost: 99850.00 }
                ]
            }
        ]
    },
    '2026-01': {
        meta: {
            year: 2026,
            month: 'January',
            totalCost: 481091.18,
            previousMonthCost: 507218.82,
            percentChange: -7.48,
            amountChange: -26128,
            currency: 'THB'
        },
        groups: [
            {
                name: 'non-charge-ส่วนกลาง',
                total: 74923.75,
                items: [
                    { name: 'kawari', cost: 1076.58 },
                    { name: 'infra (Server, Network, Security กลาง)', cost: 73847.17 }
                ]
            },
            {
                name: 'charge (server)',
                total: 296649.85,
                items: [
                    { name: 'casa', cost: 510.55 },
                    { name: 'crm', cost: 12256.04 },
                    { name: 'econsent', cost: 2402.94 },
                    { name: 'ekyc', cost: 21941.48 },
                    { name: 'e-sig', cost: 4157.18 },
                    { name: 'jelite', cost: 150619.58 },
                    { name: 'jfinconnect', cost: 7233.42 },
                    { name: 'join', cost: 20153.19 },
                    { name: 'jreward', cost: 3061.47 },
                    { name: 'klai', cost: 13180.99 },
                    { name: 'mobilecare', cost: 9516.50 },
                    { name: 'n8n', cost: 2202.71 },
                    { name: 'olympus', cost: 3063.49 },
                    { name: 'oneid', cost: 13790.89 },
                    { name: 'pah', cost: 9397.39 },
                    { name: 'rws', cost: 2997.58 },
                    { name: 'sg', cost: 728.80 },
                    { name: 'sgtracking', cost: 6465.87 },
                    { name: 'tdem', cost: 7139.36 },
                    { name: 'teenoi', cost: 5830.44 }
                ]
            },
            {
                name: 'Non-charge (Server)',
                total: 109517.58,
                items: [
                    { name: 'acb', cost: 166.81 },
                    { name: 'agm', cost: 650.56 },
                    { name: 'dcf', cost: 229.03 },
                    { name: 'dopa', cost: 816.69 },
                    { name: 'index', cost: 47.32 },
                    { name: 'jnft', cost: 2077.62 },
                    { name: 'join', cost: 15768.30 },
                    { name: 'mamori', cost: 333.73 },
                    { name: 'ndid', cost: 59640.93 },
                    { name: 'pah', cost: 29070.41 },
                    { name: 'tdem', cost: 130.52 },
                    { name: 'horo', cost: 30.82 },
                    { name: '360academy', cost: 554.85 }
                ]
            }
        ]
    }
};


