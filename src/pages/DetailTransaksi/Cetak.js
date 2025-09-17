import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import RNPrint from 'react-native-print';
import {MyButton, MyHeader} from '../../components';
import RenderHtml from 'react-native-render-html';
import {colors, windowWidth} from '../../utils';
import {useState} from 'react';
import {useEffect} from 'react';
import {getData} from '../../utils/localStorage';
export default function Cetak({navigation, route}) {
  console.log(route.params);

  const [toko, setToko] = useState({});
  useEffect(() => {
    getData('user').then(u => {
      console.log(u);
      setToko(u);
    });
  }, []);

  const transaksi = route.params.transaksi;
  const transaksi_detail = route.params.transaksi_detail;
  const total_bayar = route.params.transaksi_bayar;

  // Ganti bagian renderHTML dengan kode berikut:
  // Ganti bagian renderHTML dengan ini:
  let renderHTML = `<div style="font-family: Arial, sans-serif; font-size: 9px; color: #000; width: 100%;">
    <!-- Header -->
     <img src="${toko.foto}" width="50" height="50" />
    <table style="width: 100%; font-size: 9px;">
        <tr>
          <td style="width: 50%; vertical-align: top;">

            <strong>${toko.toko}</strong> <br/>
                ${toko.telepon}<br/>
                  ${toko.alamat}
          </td>
          <td style="width: 50%; vertical-align: top; text-align: right;">
            <strong>${transaksi.kode}</strong><br/>
            <strong>INVOICE</strong><br/>
            ${transaksi.status}
          </td>
        </tr>
      </table>

    <!-- Info Transaksi -->
    <div style="margin-bottom: 10px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5px 0;">
      <table style="width: 70%; font-size: 9px;">
        <tr>
            <td width="20%">Nama</td>
            <td width="2%">:</td>
            <td width="text-align:left;"><strong>${transaksi.nama}</strong></td>
        </tr>
         <tr>
            <td width="20%">Telepon</td>
            <td width="2%">:</td>
            <td width="text-align:left;"><strong>${
              transaksi.telepon
            }</strong></td>
        </tr>
         <tr>
            <td width="20%">Alamat</td>
            <td width="2%">:</td>
            <td width="text-align:left;"><strong>${
              transaksi.alamat
            }</strong></td>
        </tr>
      </table>
    </div>

    <!-- Detail Barang -->
    <table border="0" style="border-collapse:collapse;width: 100%; font-size: 9px;">
      <thead>
        <tr style="background-color:#FAFAFA">
          <th style="text-align: left;">Device</th>
          <th style="text-align: left;">Kerusakan</th>
          <th style="text-align: right;">Harga</th>
          <th style="text-align: right;">Diskon</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${transaksi_detail
          .map(
            item => `
          <tr>
            <td style="padding: 5px;">${item.device}</td>
            <td style="padding: 5px;">${item.kerusakan}</td>
            <td style="padding: 5px; text-align: right;">Rp ${item.harga.toLocaleString()}</td>
            <td style="padding: 5px; text-align: right;">Rp ${item.diskon.toLocaleString()}</td>
            <td style="padding: 5px; text-align: right;">Rp ${item.total.toLocaleString()}</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>

    <!-- Ringkasan -->
    <div style="width: 100%; margin-top: 20px;">
      <table border="0" style="width: 100%; font-size: 9px;">
        <tr>
          <td style="text-align: right; padding: 2px;">Subtotal :</td>
          <td style="text-align: right; padding: 2px; width: 120px;">Rp ${transaksi.total_bruto.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="text-align: right; padding: 2px;">Diskon :</td>
          <td style="text-align: right; padding: 2px;">Rp ${transaksi.total_diskon.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="text-align: right; padding: 2px;"><strong>Total :</strong></td>
          <td style="text-align: right; padding: 2px;"><strong>Rp ${transaksi.total.toLocaleString()}</strong></td>
        </tr>
        <tr>
          <td style="text-align: right; padding: 2px;">Bayar :</td>
          <td style="text-align: right; padding: 2px;">Rp ${total_bayar.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="text-align: right; padding: 2px;">Sisa :</td>
          <td style="text-align: right; padding: 2px;">Rp ${(
            transaksi.total - total_bayar
          ).toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 20px; font-size: 9px;">
      <p style="margin: 2px 0;">${transaksi.keterangan}</p>
      <p style="margin: 2px 0;">Terima kasih telah menggunakan jasa kami.</p>
    </div>

  </div>
`;

  const printInvoice = async () => {
    await RNPrint.print({
      html: renderHTML,
    });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.white,
      }}>
      <MyHeader title={transaksi.kode} />
      <View
        style={{
          flex: 1,
          padding: 10,
        }}>
        <RenderHtml
          contentWidth={windowWidth}
          source={{
            html: renderHTML,
          }}
        />
      </View>
      <View
        style={{
          padding: 10,
        }}>
        <MyButton title="Print" onPress={printInvoice} Icons="print-outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
