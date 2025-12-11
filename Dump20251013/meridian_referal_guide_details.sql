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
-- Table structure for table `referal_guide_details`
--

DROP TABLE IF EXISTS `referal_guide_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `referal_guide_details` (
  `idReferal_Guide_Details` int NOT NULL AUTO_INCREMENT,
  `CodigoInterno` varchar(255) NOT NULL,
  `CodigoAdicional` varchar(255) NOT NULL,
  `Descripcion` varchar(255) NOT NULL,
  `Cantidad` decimal(10,4) NOT NULL,
  `Id_Referal_Guide` int NOT NULL,
  PRIMARY KEY (`idReferal_Guide_Details`),
  KEY `fk_Referal_Guide_Details_Referal_Guide1_idx` (`Id_Referal_Guide`),
  CONSTRAINT `fk_Referal_Guide_Details_Referal_Guide1` FOREIGN KEY (`Id_Referal_Guide`) REFERENCES `referal_guide` (`Id_Referal_Guide`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referal_guide_details`
--

LOCK TABLES `referal_guide_details` WRITE;
/*!40000 ALTER TABLE `referal_guide_details` DISABLE KEYS */;
INSERT INTO `referal_guide_details` VALUES (1,'12345','1234152345','cajas de mercaderia variada',30.0000,1),(2,'1234','1234','MERCADERIA VARIADA',40.0000,2);
/*!40000 ALTER TABLE `referal_guide_details` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-13 16:30:17
