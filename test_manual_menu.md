# Test Manual para `menu.py`

## Introducción
Este documento describe las pruebas manuales necesarias para verificar el correcto funcionamiento de las funciones implementadas en `menu.py`. Las pruebas están divididas en dos secciones: campers y computadores.

---

## Pruebas para Campers

### 1. Registrar Camper
**Descripción:** Verificar que un nuevo camper se registre correctamente.
- **Pasos:**
  1. Ejecutar la función `registrar_camper`.
  2. Ingresar los datos solicitados por consola:
     ```
     Documento: 12345
     Nombre: Juan Perez
     ```
  3. Verificar que el mensaje de éxito se imprima en la consola.
  4. Revisar el archivo `campers.json` para confirmar que el camper fue agregado correctamente.
- **Resultado esperado:** El camper debe aparecer en el archivo JSON con la fecha de registro.

### 2. Registrar Camper Existente
**Descripción:** Verificar que no se permita registrar un camper con un documento ya existente.
- **Pasos:**
  1. Ejecutar la función `registrar_camper`.
  2. Ingresar un documento ya registrado:
     ```
     Documento: 12345
     Nombre: Juan Perez
     ```
  3. Verificar que el mensaje de error se imprima en la consola.
- **Resultado esperado:** El camper no debe duplicarse en el archivo JSON.

---

## Pruebas para Computadores

### 1. Registrar Computador
**Descripción:** Verificar que un nuevo computador se registre correctamente.
- **Pasos:**
  1. Ejecutar la función `registrar_pc`.
  2. Ingresar los datos solicitados por consola:
     ```
     ID del PC: PC001
     Fila: A1
     ```
  3. Verificar que el mensaje de éxito se imprima en la consola.
  4. Revisar el archivo `computadores.json` para confirmar que el computador fue agregado correctamente.
- **Resultado esperado:** El computador debe aparecer en el archivo JSON con los campos `en_uso`, `usuario_actual`, `estado` y `historial_fallas` inicializados correctamente.

### 2. Registrar Computador Existente
**Descripción:** Verificar que no se permita registrar un computador con un ID ya existente.
- **Pasos:**
  1. Ejecutar la función `registrar_pc`.
  2. Ingresar un ID ya registrado:
     ```
     ID del PC: PC001
     Fila: A1
     ```
  3. Verificar que el mensaje de error se imprima en la consola.
- **Resultado esperado:** El computador no debe duplicarse en el archivo JSON.