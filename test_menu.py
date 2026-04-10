import unittest
from unittest.mock import patch, mock_open
import json
from menu import app, cargar_datos, guardar_datos


class TestMenu(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    @patch("menu.os.path.exists", return_value=False)
    def test_cargar_datos_archivo_no_existe(self, mock_exists):
        resultado = cargar_datos("campers.json")
        self.assertEqual(resultado, {})
        mock_exists.assert_called_once_with("campers.json")

    @patch("menu.os.path.exists", return_value=True)
    @patch("builtins.open", new_callable=mock_open, read_data='{"12345": {"nombre": "Juan Perez"}}')
    def test_cargar_datos_archivo_con_datos(self, mock_file, mock_exists):
        resultado = cargar_datos("campers.json")
        esperado = {"12345": {"nombre": "Juan Perez"}}
        self.assertEqual(resultado, esperado)
        mock_file.assert_called_once_with("campers.json", "r", encoding="utf-8")

    @patch("builtins.open", new_callable=mock_open)
    def test_guardar_datos(self, mock_file):
        datos = {"12345": {"nombre": "Juan Perez"}}
        guardar_datos("campers.json", datos)

        mock_file.assert_called_once_with("campers.json", "w", encoding="utf-8")

        handle = mock_file()
        contenido_escrito = "".join(call.args[0] for call in handle.write.call_args_list)
        self.assertEqual(contenido_escrito, json.dumps(datos, indent=4, ensure_ascii=False))

    @patch("menu.cargar_datos", side_effect=[{}, {}])
    def test_obtener_estado(self, mock_cargar):
        response = self.client.get("/api/estado")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"campers": {}, "computadores": {}})
        self.assertEqual(mock_cargar.call_count, 2)

    @patch("menu.guardar_datos")
    @patch("menu.cargar_datos", return_value={})
    def test_registrar_camper_exitoso(self, mock_cargar, mock_guardar):
        datos = {
            "documento": "12345",
            "nombre": "Juan Perez"
        }

        response = self.client.post("/api/campers", json=datos)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json(), {"mensaje": "Camper registrado con éxito"})
        mock_cargar.assert_called_once_with("campers.json")
        mock_guardar.assert_called_once()

        archivo_guardado = mock_guardar.call_args[0][0]
        datos_guardados = mock_guardar.call_args[0][1]

        self.assertEqual(archivo_guardado, "campers.json")
        self.assertIn("12345", datos_guardados)
        self.assertEqual(datos_guardados["12345"]["nombre"], "Juan Perez")
        self.assertIn("fecha_registro", datos_guardados["12345"])

    @patch("menu.cargar_datos", return_value={"12345": {"nombre": "Juan Perez"}})
    def test_registrar_camper_existente(self, mock_cargar):
        datos = {
            "documento": "12345",
            "nombre": "Juan Perez"
        }

        response = self.client.post("/api/campers", json=datos)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json(), {"error": "El camper ya existe"})
        mock_cargar.assert_called_once_with("campers.json")

    @patch("menu.guardar_datos")
    @patch("menu.cargar_datos", return_value={})
    def test_registrar_pc_exitoso(self, mock_cargar, mock_guardar):
        datos = {
            "id_pc": "PC001",
            "fila": "A1"
        }

        response = self.client.post("/api/computadores", json=datos)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json(), {"mensaje": "Computador registrado"})
        mock_cargar.assert_called_once_with("computadores.json")
        mock_guardar.assert_called_once()

        archivo_guardado = mock_guardar.call_args[0][0]
        datos_guardados = mock_guardar.call_args[0][1]

        self.assertEqual(archivo_guardado, "computadores.json")
        self.assertIn("PC001", datos_guardados)
        self.assertEqual(datos_guardados["PC001"]["fila"], "A1")
        self.assertEqual(datos_guardados["PC001"]["en_uso"], False)
        self.assertEqual(datos_guardados["PC001"]["usuario_actual"], None)
        self.assertEqual(datos_guardados["PC001"]["estado"], "Operativo")
        self.assertEqual(datos_guardados["PC001"]["historial_fallas"], [])

    @patch("menu.cargar_datos", return_value={"PC001": {"fila": "A1"}})
    def test_registrar_pc_existente(self, mock_cargar):
        datos = {
            "id_pc": "PC001",
            "fila": "A1"
        }

        response = self.client.post("/api/computadores", json=datos)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json(), {"error": "El computador ya existe"})
        mock_cargar.assert_called_once_with("computadores.json")


if __name__ == "__main__":
    unittest.main()
