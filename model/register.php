<?php

require_once '../controller/conexion.php';

$nombre  = $_POST['nombre'];
$apellido = $_POST['apellido'];
$usuario = $_POST['usuario'];
$correo = $_POST['email'];
$pass = $_POST['password'];
$passconfirm = $_POST['confirm_password'];


function validar($usuario, $correo){

    $dbcon = new Conexion();
    $pdo = $dbcon->getConexion();

    $stmt = $pdo->prepare("SELECT usuario, correo FROM usuarios WHERE usuario = ? OR correo = ? ");
    $stmt->execute([$usuario,$correo]);

    $resultado = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if($resultado){
        echo "<script>
        alert('El usuario o correo ya se encuentra registrado');
        window.location.href = '../view/html/register.html';
        </script>
        ";
        echo $resultado;
        exit();
    }
}

if(mb_strlen($pass)<8){
    echo "
    <script>
    alert('La contraseña debe tener al menos 8 caracteres');
    window.location.href = '../view/html/register.html';
    </script>

    ";
    exit();
}

if($pass != $passconfirm){
     echo "
    <script>
    alert('Las contraseñas no coinciden');
    window.location.href = '../view/html/register.html';
    </script>

    ";
    exit();
}

$encryptpass = password_hash($pass, PASSWORD_DEFAULT);

validar($usuario, $correo);

$sql = "INSERT INTO usuarios(nombre, apellido, usuario, correo, cont) VALUES (?,?,?,?,?)";

$con = new Conexion();

$pdo= $con-> getConexion();

$insertar = $pdo->prepare($sql);

$datos = [$nombre, $apellido, $usuario, $correo, $encryptpass];

if($insertar->execute($datos ) ){
     echo "
    <script>
    alert('Usuario registrado con exito');
    window.location.href = '../view/html/index.html';
    </script>

    ";
    exit();
}
else{
     echo "
    <script>
    alert('Usuario no registrado');
    window.location.href = '../view/html/register.html' . $pdo->error;
    </script>

    ";
    exit();
}


?>