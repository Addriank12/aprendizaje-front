-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: meridian
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `referal_guide`
--

DROP TABLE IF EXISTS `referal_guide`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `referal_guide` (
  `Id_Referal_Guide` int NOT NULL AUTO_INCREMENT,
  `Secuential` varchar(45) NOT NULL,
  `DirPartida` varchar(255) NOT NULL,
  `RazonSocialTransportista` varchar(255) NOT NULL,
  `TipoIdentificacionTransportista` varchar(2) NOT NULL,
  `IdentificacionTransportista` varchar(13) NOT NULL,
  `Rise` varchar(255) NOT NULL,
  `FechaIniTransporte` datetime NOT NULL,
  `FechaFinTransporte` datetime NOT NULL,
  `Placa` varchar(10) NOT NULL,
  `Destino` varchar(255) NOT NULL,
  `facturas_id` int DEFAULT NULL,
  `FechaEmision` datetime NOT NULL,
  `Ambiente` varchar(1) NOT NULL,
  `Establecimiento` varchar(3) NOT NULL,
  `Emision` varchar(3) NOT NULL,
  `DirMatriz` varchar(255) NOT NULL,
  `DirEstablecimiento` varchar(255) NOT NULL,
  `Motivo` varchar(125) NOT NULL,
  `Ruta` varchar(45) NOT NULL,
  `destinatario_id` int NOT NULL,
  PRIMARY KEY (`Id_Referal_Guide`),
  UNIQUE KEY `Secuential_UNIQUE` (`Secuential`),
  KEY `fk_Referal_Guide_facturas1_idx` (`facturas_id`),
  KEY `fk_Referal_Guide_clientes1_idx` (`destinatario_id`),
  CONSTRAINT `fk_Referal_Guide_clientes1` FOREIGN KEY (`destinatario_id`) REFERENCES `clientes` (`Id`),
  CONSTRAINT `fk_Referal_Guide_facturas1` FOREIGN KEY (`facturas_id`) REFERENCES `facturas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referal_guide`
--

LOCK TABLES `referal_guide` WRITE;
/*!40000 ALTER TABLE `referal_guide` DISABLE KEYS */;
INSERT INTO `referal_guide` VALUES (1,'001-050-000000001','GUAYAQUIL','GEOVANNY MEJIA','04','0103743928001','Contribuyente Regimen General','2024-02-09 10:09:35','2024-02-09 00:00:00','ABC-123','PAUTE',NULL,'2024-02-09 10:13:32','0','001','050','ABDON CALDERON 6-22 Y SIMON BOLIVAR','ABDON CALDERON 6-22 Y SIMON BOLIVAR','Compra','GUAYAQUIL-PAUTE',2258),(2,'001-050-000000002','GUAYAQUIL ','GEOVANNY MEJIA','05','0103743928','','2024-02-09 15:08:49','2024-02-09 00:00:00','ABH-3689','PAUTE',NULL,'2024-02-09 15:12:00','0','001','050','ABDON CALDERON 6-22 Y SIMON BOLIVAR','ABDON CALDERON 6-22 Y SIMON BOLIVAR','Compra','GUAYAQUIL-PAUTE',2258);
/*!40000 ALTER TABLE `referal_guide` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-13 16:30:15
