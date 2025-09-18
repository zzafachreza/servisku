import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import RNPrint from 'react-native-print';
import {MyButton, MyHeader} from '../../components';
import RenderHtml from 'react-native-render-html';
import {colors, windowWidth} from '../../utils';
import {useState} from 'react';
import {useEffect} from 'react';
import {getData} from '../../utils/localStorage';
import {WebView} from 'react-native-webview';

import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import {useRef} from 'react';
import moment from 'moment';

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
  let renderHTML = `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #000; width: 100%;">
  
  <!-- Header -->
  <table style="width: 100%; font-size: 18px; margin-bottom: 20px;">
    <tr>
    <td>
     <img src="${toko.foto}" width="80" height="80" />
     </td>
      <td style="width: 40%;">
       
        <strong style="font-size:25px">${toko.toko}</strong><br/>
        ${toko.alamat}<br/>
        ${toko.telepon}
      </td>
      <td style="width: 70%; vertical-align: top; text-align: right;">
       ${moment(transaksi.tanggal).format('DD MMMM YYYY')}<br/>
        Kepada: <strong>${transaksi.nama}</strong><br/>
        Kontak: ${transaksi.telepon}<br/>
        Alamat: ${transaksi.alamat}
      </td>
    </tr>
  </table>

  <!-- Detail Barang -->
  <table border="1" style="border-collapse:collapse; width: 100%; font-size: 18px;" cellspacing="2" cellpadding="5">
    <thead>
      <tr style="background-color:#FAFAFA">
        <th style="text-align: center; width: 5%;">No</th>
        <th style="text-align: left; width: 30%;">Merk & Type</th>
        <th style="text-align: left; width: 30%;">Kerusakan</th>
        <th style="text-align: right; width: 20%;">Harga</th>
        <th style="text-align: right; width: 30%;">Jumlah</th>
      </tr>
    </thead>
    <tbody>
      ${transaksi_detail
        .map(
          (item, index) => `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${item.device}<br/><i><small>SN: ${item.serial}</small></i></td>
          <td>${item.kerusakan}</td>
          <td style="text-align: right;">Rp ${item.harga.toLocaleString()}</td>
          <td style="text-align: right;">Rp ${item.total.toLocaleString()}</td>
        </tr>
      `,
        )
        .join('')}
    </tbody>
  </table>

  <!-- Ringkasan -->
  <div style="width: 100%; margin-top: 10px;">
    <table border="0" cellpadding="8" style="width: 100%; font-size: 20px;">
      <tr>
        <td style="text-align: left;">${transaksi.keterangan}</td>
        <td style="text-align: right;">Subtotal :</td>
        <td style="text-align: right; width: 120px;">Rp ${transaksi.total_bruto.toLocaleString()}</td>
      </tr>
      <tr>
        <td></td>
        <td style="text-align: right;">Diskon :</td>
        <td style="text-align: right;">Rp ${transaksi.total_diskon.toLocaleString()}</td>
      </tr>
      <tr>
        <td></td>
        <td style="text-align: right;"><strong>Total Harga :</strong></td>
        <td style="text-align: right;"><strong>Rp ${transaksi.total.toLocaleString()}</strong></td>
      </tr>
      <tr>
        <td></td>
        <td style="text-align: right;">Bayar :</td>
        <td style="text-align: right;">Rp ${total_bayar.toLocaleString()}</td>
      </tr>
      <tr>
        <td></td>
        <td style="text-align: right;">Sisa :</td>
        <td style="text-align: right;">Rp ${(
          transaksi.total - total_bayar
        ).toLocaleString()}</td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; font-size: 14px;">
    <p style="margin: 2px 0;">${toko.catatan}</p>
  </div>

</div>
`;

  let renderHTML58mm = `
<div style="font-family: 'Courier New', monospace; font-size: 12px; color: #000; width: 58mm; max-width: 220px; padding: 5px; line-height: 1.2;">
  
  <!-- Header Toko -->
  <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
    <img src="${
      toko.foto
    }" width="50" height="50" style="margin-bottom: 5px;" /><br/>
    <div style="font-size: 14px; font-weight: bold; margin-bottom: 3px;">${
      toko.toko
    }</div>
    <div style="font-size: 10px;">${toko.alamat}</div>
    <div style="font-size: 10px;">${toko.telepon}</div>
  </div>

  <!-- Info Transaksi -->
  <div style="margin-bottom: 8px; font-size: 10px;">
    <div>Tanggal: ${moment(transaksi.tanggal).format('DD MMMM YYYY')}</div>
    <div>Nama: ${transaksi.nama}</div>
    <div>Telp: ${transaksi.telepon}</div>
    <div>Alamat: ${transaksi.alamat}</div>
  </div>

  <!-- Garis Pemisah -->
  <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>

  <!-- Detail Barang -->
  <div style="font-size: 10px;">
    ${transaksi_detail
      .map(
        (item, index) => `
    <div style="margin-bottom: 8px; border-bottom: 1px dotted #ccc; padding-bottom: 5px;">
      <div style="font-weight: bold;">${index + 1}. ${item.device}</div>
      <div style="font-size: 9px; font-style: italic; color: #666;">SN: ${
        item.serial
      }</div>
      <div style="margin: 2px 0;">Kerusakan: ${item.kerusakan}</div>
      <div style="display: flex; justify-content: space-between; margin-top: 3px;">
        <span>Harga:</span>
        <span>Rp ${item.harga.toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: bold;">
        <span>Total:</span>
        <span>Rp ${item.total.toLocaleString()}</span>
      </div>
    </div>
    `,
      )
      .join('')}
  </div>

  <!-- Garis Pemisah -->
  <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>

  <!-- Keterangan -->
  ${
    transaksi.keterangan
      ? `<div style="font-size: 10px; margin-bottom: 8px; font-style: italic;">${transaksi.keterangan}</div>`
      : ''
  }

  <!-- Ringkasan Pembayaran -->
  <div style="font-size: 11px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
      <span>Subtotal:</span>
      <span>Rp ${transaksi.total_bruto.toLocaleString()}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
      <span>Diskon:</span>
      <span>Rp ${transaksi.total_diskon.toLocaleString()}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #000; padding-top: 3px; margin-top: 5px;">
      <span>TOTAL HARGA:</span>
      <span>Rp ${transaksi.total.toLocaleString()}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 5px;">
      <span>Bayar:</span>
      <span>Rp ${total_bayar.toLocaleString()}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 2px; ${
      transaksi.total - total_bayar > 0
        ? 'color: red; font-weight: bold;'
        : 'color: green;'
    }">
      <span>${transaksi.total - total_bayar > 0 ? 'Sisa:' : 'Kembali:'}</span>
      <span>Rp ${Math.abs(
        transaksi.total - total_bayar,
      ).toLocaleString()}</span>
    </div>
  </div>

  <!-- Garis Pemisah -->
  <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>

  <!-- Footer -->
  <div style="text-align: center; font-size: 9px; margin-top: 8px;">
    <div style="margin-bottom: 5px;">${toko.catatan}</div>
  </div>

</div>
`;

  const print58mm = async () => {
    await RNPrint.print({
      html: renderHTML58mm,
    });
  };

  const viewShotRef = useRef();

  const shareData = async () => {
    const uri = await viewShotRef.current.capture();
    await Share.open({
      title: 'Bagikan Invoice',
      url: 'file://' + uri,
      type: 'image/png',
    });
  };

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

      <ViewShot
        style={{
          flex: 1,
          paddingTop: 20,
        }}
        ref={viewShotRef}
        options={{format: 'png', quality: 0.9}}>
        <View
          style={{
            flex: 1,
            padding: 10,
          }}>
          <WebView
            source={{
              html: renderHTML,
            }}
            style={{flex: 1}}
          />
        </View>
      </ViewShot>

      <View
        style={{
          padding: 10,
          flexDirection: 'row',
        }}>
        <View
          style={{
            flex: 1,
          }}>
          <MyButton
            title="Print A4"
            onPress={printInvoice}
            Icons="print-outline"
          />
        </View>
        <View
          style={{
            flex: 1,
          }}>
          <MyButton
            warna={colors.secondary}
            title="Share"
            onPress={shareData}
            Icons="share-outline"
          />
        </View>
        <View
          style={{
            flex: 1,
          }}>
          <MyButton
            title="Print 58mm"
            onPress={print58mm}
            Icons="print-outline"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
