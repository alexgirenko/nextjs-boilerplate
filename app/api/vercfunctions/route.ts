import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const name = body?.name;
		if (typeof name !== 'string') {
			return NextResponse.json({ error: 'Name is required and must be a string.' }, { status: 400 });
		}
		return NextResponse.json({ result: `Hello ${name}` });
	} catch (error: unknown) {
		if (error instanceof SyntaxError) {
			return NextResponse.json({ error: 'Invalid JSON format.' }, { status: 400 });
		}
		return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
	}
}
