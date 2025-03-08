// mengambil harga dari server dan menampilkannya di halaman Form user
function loadPrices() {
    fetch('/get_prices')
        .then(response => response.json())
        .then(data => {
            document.getElementById('higgs_price').innerText = `${data.higgs_domino} /B`;
            document.getElementById('royal_price').innerText = `${data.royal_domino} /B`;
        })
        .catch(error => console.error('Error fetching prices:', error));
        }
document.addEventListener('DOMContentLoaded', loadPrices);

// Mengambil id_select dan update dropdown ke server saat dropdown di klik
function updateDropdown() {
    fetch('/get_id_select')
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById('id_tujuan');
            // Simpan nilai yang dipilih saat ini
            const selectedValue = dropdown.value; 
            // Kosongkan dropdown sebelum menambahkan opsi baru
            dropdown.innerHTML = ''; 
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.target_id;
                option.textContent = item.target_id;
                dropdown.appendChild(option);
            });
            // Setel kembali nilai yang dipilih
            dropdown.value = selectedValue; 
        })
        .catch(error => {
            console.error('Error fetching IDs:', error);
        });
}

// Kosongkan dropdown saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    const dropdown = document.getElementById('id_tujuan');
    // Kosongkan dropdown saat halaman dimuat
    dropdown.innerHTML = ''; 
});

// Panggil fungsi untuk memperbarui dropdown saat dropdown di klik
document.getElementById('id_tujuan').addEventListener('click', updateDropdown);

// Menyalin ID yang dipilih ke clipboard
document.getElementById('copyButton').addEventListener('click', function() {
    const idTujuanDropdown = document.getElementById('id_tujuan');
    const selectedID = idTujuanDropdown.options[idTujuanDropdown.selectedIndex].value;
    
    // Membuat elemen input sementara untuk menyalin teks
    const tempInput = document.createElement('input');
    tempInput.value = selectedID;
    document.body.appendChild(tempInput);
    
    tempInput.select();
    // Untuk mobile device
    tempInput.setSelectionRange(0, 99999); 
    document.execCommand('copy');

    document.body.removeChild(tempInput);
    alert('ID berhasil disalin: ' + selectedID);
});


// Mengirim data form ke server
document.getElementById('submitBtn').addEventListener('click', function() {
    
    const idTujuan = document.getElementById('id_tujuan').value;
    const nickname = document.getElementById('nickname').value;
    const idPengirim = document.getElementById('id_pengirim').value;
    const jumlahKirim = document.getElementById('jumlah_kirim').value;
    const nomorDana = document.getElementById('nomor_dana').value;

    if (!idTujuan || !nickname || !idPengirim || !jumlahKirim || !nomorDana) {
        alert('Silahkan isi semua data yang diperlukan!');
        return;
    }
    
    const formData = new FormData();
    formData.append('id_tujuan', idTujuan);
    formData.append('nickname', nickname);
    formData.append('id_pengirim', idPengirim);
    formData.append('jumlah_kirim', jumlahKirim);
    formData.append('nomor_dana', nomorDana);

    // mengirim file screenshot 
    const screenshot = document.getElementById('screenshot').files[0];
    if (screenshot) {
        formData.append('screenshot', screenshot);
    }

    // Mengirim data form ke server
    fetch('/submit', {
        method: 'POST',
        body: formData
    }).then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Data berhasil dikirim!');
            
            // Kosongkan semua field form setelah data berhasil dikirim
            document.getElementById('id_tujuan').value = '';
            document.getElementById('nickname').value = '';
            document.getElementById('id_pengirim').value = '';
            document.getElementById('jumlah_kirim').value = '';
            document.getElementById('nomor_dana').value = '';
            document.getElementById('screenshot').value = '';
        } else {
            alert('Error: ' + data.message);
        }
    }).catch(error => console.error('Error submitting form:', error));
});
