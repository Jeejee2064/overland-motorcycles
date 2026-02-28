import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const returnUrlPlain = `${process.env.NEXT_PUBLIC_BASE_URL}/auth-success`;
    const returnUrlHex = Buffer.from(returnUrlPlain).toString('hex');

    const pagueloFacilData = {
      CCLW: process.env.PAGUELOFACIL_CCLW,
      TX_TYPE: 'AUTH',
      CMTN: '1000.00',
      CDSC: 'Test Security Deposit Authorization - $1000',
      RETURN_URL: returnUrlHex,
      EXPIRES_IN: 3600,
    };

    const linkDeamonUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://secure.paguelofacil.com/LinkDeamon.cfm'
        : 'https://sandbox.paguelofacil.com/LinkDeamon.cfm';

    const formBody = Object.keys(pagueloFacilData)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(pagueloFacilData[key])}`)
      .join('&');

    const response = await fetch(linkDeamonUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: '*/*',
      },
      body: formBody,
    });

    const data = await response.json();

    console.log('PF Response:', data);

    if (!data.success || !data.data?.url) {
      return NextResponse.json(
        { error: data.message || 'Failed to create AUTH link', raw: data },
        { status: 400 }
      );
    }

    return NextResponse.json({
      url: data.data.url,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}