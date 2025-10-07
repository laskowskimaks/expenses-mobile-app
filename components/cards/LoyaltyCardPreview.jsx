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
    let displayableBarcodeFormat = null;
    try {
        displayableBarcodeFormat = convertScannerFormatToGeneratorFormat(barcodeFormat);
    } catch (e) {
        return (
            <View style={[{ alignItems: 'center', padding: 16 }, style]}>
                <RNText style={{ color: 'red', textAlign: 'center' }}>
                    Wystąpił błąd podczas przetwarzania formatu kodu kreskowego. Kod nie zostanie wyświetlony.
                </RNText>
            </View>
        );
    }

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
        try {
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
        } catch (e) {
            return (
                <View style={[{ alignItems: 'center', padding: 16 }, style]}>
                    <RNText style={{ color: 'red', textAlign: 'center' }}>
                        Wystąpił błąd podczas renderowania kodu kreskowego. Kod nie zostanie wyświetlony.
                    </RNText>
                </View>
            );
        }
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
    barcodeCard: {
        marginBottom: 24,
        paddingVertical: 20,
        backgroundColor: 'white'
    },
    barcodeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        minHeight: 120
    },
});