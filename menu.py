from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

# ==========================================
# CONFIGURACIÓN DEL SERVIDOR FLASK
# ==========================================
app = Flask(__name__)
CORS(app) # Permite conectar el index.html con Python

# Archivos JSON para la permanencia de datos
ARCHIVO_CAMPERS = 'campers.json'
ARCHIVO_COMPUTADORES = 'computadores.json'

# ==========================================
# FUNCIONES DE LECTURA Y ESCRITURA JSON
# ==========================================
def cargar_datos(archivo):
    """Carga los datos desde un archivo JSON. Retorna diccionario vacío si no existe."""
    if not os.path.exists(archivo):
        return {}
    with open(archivo, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def guardar_datos(archivo, datos):
    """Guarda el diccionario de datos sobrescribiendo el archivo JSON."""
    with open(archivo, 'w', encoding='utf-8') as f:
        json.dump(datos, f, indent=4, ensure_ascii=False)

# ==========================================
# RUTAS DE LA API (ENDPOINTS)
# ==========================================

@app.route('/api/estado', methods=['GET'])
def obtener_estado():
    """Devuelve todos los campers y computadores al frontend."""
    campers = cargar_datos(ARCHIVO_CAMPERS)
    computadores = cargar_datos(ARCHIVO_COMPUTADORES)
    return jsonify({"campers": campers, "computadores": computadores})

@app.route('/api/campers', methods=['POST'])
def registrar_camper():
    """Registra un nuevo camper en campers.json"""
    datos = request.json
    campers = cargar_datos(ARCHIVO_CAMPERS)
    
    documento = datos['documento']
    if documento in campers:
        return jsonify({"error": "El camper ya existe"}), 400
        
    campers[documento] = {
        "nombre": datos['nombre'],
        "fecha_registro": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    guardar_datos(ARCHIVO_CAMPERS, campers)
    return jsonify({"mensaje": "Camper registrado con éxito"}), 201

@app.route('/api/computadores', methods=['POST'])
def registrar_pc():
    """Registra un nuevo computador en computadores.json"""
    datos = request.json
    computadores = cargar_datos(ARCHIVO_COMPUTADORES)
    
    id_pc = datos['id_pc']
    if id_pc in computadores:
        return jsonify({"error": "El computador ya existe"}), 400
        
    computadores[id_pc] = {
        "fila": datos['fila'],
        "en_uso": False,
        "usuario_actual": None,
        "estado": "Operativo",
        "historial_fallas": []
    }
    
    guardar_datos(ARCHIVO_COMPUTADORES, computadores)
    return jsonify({"mensaje": "Computador registrado"}), 201

@app.route('/api/asignar', methods=['POST'])
def asignar_equipo():
    """Asigna un PC a un camper."""
    datos = request.json
    computadores = cargar_datos(ARCHIVO_COMPUTADORES)
    
    id_pc = datos['id_pc']
    if id_pc in computadores:
        computadores[id_pc]['en_uso'] = True
        computadores[id_pc]['usuario_actual'] = datos['documento_camper']
        guardar_datos(ARCHIVO_COMPUTADORES, computadores)
        return jsonify({"mensaje": "Equipo asignado"})
    return jsonify({"error": "PC no encontrado"}), 404

@app.route('/api/liberar', methods=['POST'])
def liberar_equipo():
    """Libera el equipo y guarda la novedad en el JSON si falta la USB o falla el software."""
    datos = request.json
    computadores = cargar_datos(ARCHIVO_COMPUTADORES)
    campers = cargar_datos(ARCHIVO_CAMPERS)
    
    id_pc = datos['id_pc']
    hay_novedad = datos['hay_novedad']
    novedad_texto = datos.get('novedad', '')
    
    if id_pc in computadores:
        usuario_doc = computadores[id_pc]['usuario_actual']
        nombre_usuario = campers.get(usuario_doc, {}).get('nombre', 'Desconocido')
        
        estado_nuevo = "Con Novedad" if hay_novedad else "Operativo"
        
        computadores[id_pc]['en_uso'] = False
        computadores[id_pc]['usuario_actual'] = None
        computadores[id_pc]['estado'] = estado_nuevo
        
        # Guardar historial si hubo daño
        if hay_novedad:
            nueva_falla = {
                "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "responsable": nombre_usuario,
                "documento": usuario_doc,
                "descripcion": novedad_texto
            }
            # Asegurar que exista la lista de historial
            if "historial_fallas" not in computadores[id_pc]:
                computadores[id_pc]['historial_fallas'] = []
                
            computadores[id_pc]['historial_fallas'].append(nueva_falla)
            
        guardar_datos(ARCHIVO_COMPUTADORES, computadores)
        return jsonify({"mensaje": "Equipo liberado"})
        
    return jsonify({"error": "PC no encontrado"}), 404

if __name__ == '__main__':
    # Inicia el servidor API en el puerto 5000
    print("Iniciando API Cajasan en http://localhost:5000")
    app.run(debug=True, port=5000)