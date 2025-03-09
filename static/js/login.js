// Mengirim data form ke server
document.getElementById('loginBtn').addEventListener('click', function() {
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;


    if (!username || !password) {
        alert('Silahkan isi semua data yang diperlukan!');
        return;
    }
    
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    // Mengirim data form ke server
    fetch('/login_submit', {
        method: 'POST',
        body: formData
    }).then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Redirect ke dashboard jika login berhasil
            window.location.href = '/dashboard'; // Ganti dengan URL dashboard Anda
        } else {
            alert('Error: ' + data.message);
        }
    }).catch(error => console.error('Error submitting form:', error));
});
