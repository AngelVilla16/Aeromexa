<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once '../controller/conexion.php';
session_start();

$correo = $_POST['correo'];
$pass = $_POST['password'];

 function validar($correo){
    $con = new Conexion();
    $pdo = $con->getConexion();

    $stmt = $pdo->prepare("SELECT correo, usuario FROM usuarios WHERE correo = ? OR usuario = ?");
    $stmt->execute([$correo,$correo]);
    $resultado = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if(!$resultado){
        echo "<script>
        alert('El usuario o correo es incorrecto o no se encuentra registrado');
        window.location.href = '../view/html/login.html';
        </script>
        ";
        exit();
    }
}
function validarpass($correo, $pass){
    $con = new Conexion();
    $pdo = $con->getConexion();

    $stmt = $pdo->prepare("SELECT cont FROM usuarios WHERE correo = ? OR usuario = ?");
    $stmt->execute([$correo, $correo]);

    $resultado = $stmt->fetchColumn();

    if(!password_verify($pass, $resultado)){
         echo "<script>
        alert('Contraseña incorrecta');
        window.location.href = '../view/html/login.html';
        </script>
        ";
        exit();
    }
}
validar($correo);
validarpass($correo,$pass);

echo "<script>
window.location.href = '../view/html/index.html';
</script>
";

?>