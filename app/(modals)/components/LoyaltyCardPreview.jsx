import React from 'react';
import { View, StyleSheet, Image, Text as RNText } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Barcode } from 'react-native-svg-barcode';
import { convertScannerFormatToGeneratorFormat } from '@/services/barcodeService';
import { Card } from 'react-native-paper';

export default function LoyaltyCardPreview({
    barcodeData,
    barcodeFormat,
    imageUri,
    theme,
    imageWidth,
    imageHeight,
    onImageLoad,
    style,
}) {
    const displayableBarcodeFormat = convertScannerFormatToGeneratorFormat(barcodeFormat);

    if (imageUri && typeof imageUri === 'string' && imageUri !== 'null' && imageUri !== '') {
        return (
            <Card style={{ marginBottom: 24 }}>
                <Image
                    source={{ uri: imageUri }}
                    style={{
                        width: '100%',
                        height: imageWidth && imageHeight ? undefined : 220,
                        aspectRatio: imageWidth && imageHeight ? imageWidth / imageHeight : undefined,
                        borderRadius: 12,
                    }}
                    resizeMode="contain"
                    onLoad={onImageLoad}
                />
            </Card>

        );
    }
    if (barcodeData && displayableBarcodeFormat) {
        return (
            <Card style={styles.barcodeCard}>
                <Card.Content>
                    <View style={styles.barcodeContainer}>
                        {displayableBarcodeFormat === 'QR_CODE' ? (
                            <QRCode value={barcodeData} size={200} />
                        ) : (
                            <Barcode
                                value={barcodeData}
                                format={displayableBarcodeFormat}
                                text={barcodeData}
                                width={3.5}
                                height={140}
                                textColor={theme.colors.onSurface}
                                lineColor={'#000000'}
                            />
                        )}
                    </View>
                </Card.Content>
            </Card>
        );
    }
    if (barcodeData && barcodeFormat) {
        return (
            <View style={[{ alignItems: 'center', padding: 16 }, style]}>
                <RNText style={{ color: 'red', textAlign: 'center' }}>
                    Nie można wyświetlić podglądu dla tego formatu ({barcodeFormat}). Zostanie on jednak poprawnie zapisany.
                </RNText>
            </View>
        );
    }
    return null;
}

const styles = StyleSheet.create({
    barcodeCard: { marginBottom: 24, paddingVertical: 20, backgroundColor: 'white' },
    barcodeContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, minHeight: 120 },
});