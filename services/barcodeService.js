export const convertScannerFormatToGeneratorFormat = (scannerFormat) => {
    if (scannerFormat === null || scannerFormat === undefined) return null;

    const formatMap = {
        'qr': 'QR_CODE',
        'ean13': 'EAN13',
        'ean_13': 'EAN13',
        'ean8': 'EAN8',
        'ean_8': 'EAN8',
        'code128': 'CODE128',
        'code39': 'CODE39',
        'upc_a': 'UPC',
        'upc_e': 'UPC',
        'upc': 'UPC',
        'itf': 'ITF',
        'codabar': 'CODABAR',
        'msi': 'MSI',
        'pdf417': 'PDF_417',
    };

    const formatKey = String(scannerFormat).toLowerCase().replace(/_/g, '');

    return formatMap[formatKey] || null;
};