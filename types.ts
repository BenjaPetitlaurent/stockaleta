export type RootStackParamList = {
  RegistroScreen: undefined;
  LoginScreen: undefined;
  HomeScreen: undefined;
  FacturaScreen: undefined;
  InventarioScreen: undefined;
  HacerInventarioScreen: undefined;
  VerFacturasScreen: undefined;
  VerInventarioScreen: undefined;
  ResumenMensualScreen: undefined;
  EditarInventarioScreen: {
    inventario: {
      id: string;
      fecha: string;
      activos: {
        nombre: string;
        cantidad: number;
        estado: string;
      }[];
    };
  };
};
