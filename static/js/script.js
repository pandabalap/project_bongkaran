// Update status checkbox
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('input[type="checkbox"]').forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            // Mengambil ID dari checkbox
            const recordId = this.id.replace('show', '');  
            const status = this.checked ? 'active' : 'disable';

            fetch('/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: recordId, status: status })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
            })
            .catch(error => console.error('Error:', error));
        });
    });
});

// Update isi_chip
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.update_isi_btn').forEach(function(button) {
        button.addEventListener('click', function() {
            // Ambil input isi_chip
            const inputElement = this.previousElementSibling; 
            // Nilai isi_chip
            const isi_chip = inputElement.value; 
            // Mengambil ID item terkait
            const recordId = inputElement.getAttribute('data-id'); 

            console.log(`Sending ID: ${recordId}, isi_chip: ${isi_chip}`);

            fetch('/update-chip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: recordId, isi_chip: isi_chip })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
            })
            .catch(error => console.error('Error:', error));
        });
    });
});

// Update status button
document.querySelectorAll('.update-status').forEach(function(button) {
    button.addEventListener('click', function() {
        // Mengambil ID dari button
        const recordId = this.id.replace('update-status', '');  
        const status = 'diklaim';

        console.log(`Sending ID: ${recordId}, status: ${status}`);

        fetch('/update-btn-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: recordId, status: status })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            // Update the status di DOM
            const statusElement = document.getElementById(`status-${recordId}`);
            if (statusElement) {
                statusElement.textContent = status;

                // hapus class sebelumnya
                statusElement.classList.remove('status-pending');
                statusElement.classList.add('status-claimed');
            }
        })
        .catch(error => console.error('Error:', error));
    });
});

function copyToClipboard(id) {
    // Ambil elemen nomor Dana berdasarkan ID tujuan
    var noDanaText = document.getElementById('noDana' + id).innerText;

    // Copy nomor danda
    navigator.clipboard.writeText(noDanaText).then(function() {
        alert('Nomor Dana ' + noDanaText + ' berhasil disalin!');
    }).catch(function(error) {
        alert('Gagal menyalin teks: ' + error);
    });
}


