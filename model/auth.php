<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();

require_once '../controller/conexion.php';

$db_conexion = new Conexion();
$pdo = $db_conexion->getConexion();

if(isset($_POST['correo']) && isset($_POST['password'])){
     function validate($data){
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data);
        return $data;
}
$correo = validate($_POST['correo']);
$pass = validate($_POST['password']);
$user = validate($_POST['correo']);

$stmt = $pdo->prepare("SELECT id_usuario, nombre, apellido, usuario, correo, cont FROM usuarios WHERE correo = ? OR usuario = ?");
$stmt->execute([$correo,$user]);

$datos = $stmt->fetch(PDO::FETCH_ASSOC);
if(!$datos){
    echo "
        <script>
        alert('Usuario no existente o incorrecto');
        window.location.href = '../view/html/login.html';
        </script>
    ";
}
else{
    $hash = $datos['cont'];
    if(password_verify($pass, $hash)){
        $_SESSION["id"] = $datos['id_usuario'];
        $_SESSION["nombre"] = $datos['nombre'];
        $_SESSION["apellido"] = $datos['apellido'];
        $_SESSION["usuario"] = $datos['usuario'];
       
        $_SESSION["correo"] = $datos['correo'];

        header("Location: http://localhost/aeromexa/view/html/index.php");
        exit();
    }
    else{
        echo "
        <script>
        alert('Contraseña incorrecta');
        window.location.href = '../view/html/login.html';
        </script>
    ";
    }
}
}

?>