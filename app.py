from flask import Flask, render_template, request, jsonify, redirect, url_for, send_from_directory
import os
from werkzeug.utils import secure_filename
import psycopg2
from psycopg2 import OperationalError
from psycopg2.extras import RealDictCursor

app = Flask(__name__)

# Fungsi untuk membuat koneksi ke database
def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname="bongkaran",
            user="postgres",
            password="postgres",
            host="localhost"
        )
        print("Koneksi ke database berhasil!")
        return conn
    except OperationalError as e:
        print(f"Koneksi gagal: {e}")
        return None

# Memanggil fungsi untuk mengecek koneksi
connection = get_db_connection()
if connection:
    connection.close()

################# Route Untuk Form User #################

# Route untuk menampilkan halaman utama
@app.route('/')
def user():
    return render_template('user.html')

# Route untuk mengambil data harga dari database
@app.route('/get_prices', methods=['GET'])
def get_prices():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT nama_game, harga FROM prices')
    prices = cur.fetchall()
    cur.close()
    conn.close()

    # Mengatur output dalam format JSON
    result = {
        'higgs_domino': next((harga for nama_game, harga in prices if nama_game == 'Higgs Domino'), 0),
        'royal_domino': next((harga for nama_game, harga in prices if nama_game == 'Royal Domino'), 0)
    }
    return jsonify(result)

# Route untuk mengambil data id yang aktif dari database
@app.route('/get_id_select', methods=['GET'])
def get_ids():
    conn = get_db_connection()
    cur = conn.cursor()

    # Mengambil data id yang aktif dari database
    cur.execute('SELECT id, target_id FROM id_select WHERE status = \'active\'')
    ids = cur.fetchall()

    cur.close()
    conn.close()

    # Mengembalikan hasil dalam bentuk JSON
    result = [{'id': row[0], 'target_id': row[1]} for row in ids]
    return jsonify(result)

# Folder upload untuk gambar/screenshot
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Batasan format file yang diperbolehkan
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Route untuk menangani pengiriman form dan upload screenshot
@app.route('/submit', methods=['POST'])
def submit_form():
    id_tujuan = request.form.get('id_tujuan')
    nickname = request.form.get('nickname')
    id_pengirim = request.form.get('id_pengirim')
    jumlah_kirim = request.form.get('jumlah_kirim')
    nomor_dana = request.form.get('nomor_dana')
    screenshot = request.files.get('screenshot')

    missing_fields = [field for field, value in {
        'id_tujuan': id_tujuan,
        'nickname': nickname,
        'id_pengirim': id_pengirim,
        'jumlah_kirim': jumlah_kirim,
        'nomor_dana': nomor_dana
    }.items() if not value]

    if missing_fields:
        return jsonify({'status': 'error', 'message': f'Missing fields: {", ".join(missing_fields)}'}), 400
    
    if 'screenshot' not in request.files:
        return 'No file part'
    
    screenshot = request.files['screenshot']
    
    if screenshot.filename == '':
        return 'No selected file'
    
    # Validasi file gambar
    if screenshot and allowed_file(screenshot.filename):
        filename = secure_filename(screenshot.filename)
        screenshot_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        screenshot.save(screenshot_path)
        screenshot_filename = filename
    else:
        return jsonify({'status': 'error', 'message': 'Format Tidak sesuai. hanya PNG, JPG, and JPEG yang dapat diupload.'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'error', 'message': 'Koneksi database Gagal !.'}), 500

    cur = conn.cursor()
    try:
        # Insert data ke dalam tabel data_user
        cur.execute(
            """
            INSERT INTO data_user (id_tujuan, nickname, id_pengirim, jumlah_kirim, nomor_dana, screenshot)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (id_tujuan, nickname, id_pengirim, jumlah_kirim, nomor_dana, screenshot_filename)
        )

        # Update isi_chip di tabel id_select berdasarkan target_id
        cur.execute(
            """
            UPDATE id_select
            SET isi_chip = isi_chip + %s
            WHERE target_id = %s
            """,
            (jumlah_kirim, id_tujuan)
        )

        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
        return jsonify({'status': 'error', 'message': f'Error: {e}'}), 500
    finally:
        cur.close()
        conn.close()

    return jsonify({'status': 'success'})


################# Route Untuk Dashboard admin #################

# Route untuk menampilkan halaman dashboard
@app.route("/dashboard")
def dashboard():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    # Mengambil data dari tabel data_user
    cursor.execute('SELECT * FROM data_user order by id desc')
    records = cursor.fetchall()

    # Mengambil data dari tabel id_select
    cursor.execute('SELECT id, target_id, isi_chip, status FROM id_select')
    id_select_data = cursor.fetchall()
    conn.close()
    
    return render_template('dashboard.html', records=records, id_select_data=id_select_data)

# Route untuk mengambil data dari tabel id_select dan tombol checkbox
@app.route('/update-status', methods=['POST'])
def update_status():
    data = request.json
    record_id = data.get('id')
    status = data.get('status')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('UPDATE id_select SET status = %s WHERE id = %s', (status, record_id))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Status updated successfully'})

# Route untuk update isi_chip dan tombol update chip
@app.route('/update-chip', methods=['POST'])
def update_chip():
    data = request.get_json()
    record_id = data.get('id')
    isi_chip = data.get('isi_chip')

    # Log input data for debugging
    print(f"Updating record ID: {record_id} with isi_chip: {isi_chip}")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Update isi_chip di database berdasarkan id
        cursor.execute('UPDATE id_select SET isi_chip = %s WHERE id = %s', (isi_chip, record_id))
        conn.commit()
        
        print("Database updated successfully.")
        
        response = {'message': 'Data updated successfully'}
    except Exception as e:
        print(f"Error: {e}")
        response = {'message': 'Failed to update data'}
    finally:
        cursor.close()
        conn.close()

    return jsonify(response)

# route untuk button update status klaim
@app.route('/update-btn-status', methods=['POST'])
def update_btn_status():
    data = request.json
    record_id = data.get('id')
    status = data.get('status')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('UPDATE data_user SET status = %s WHERE id = %s', (status, record_id))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Status updated successfully'})

# Menjalankan server Flask
if __name__ == '__main__':
    app.run(debug=True)
