import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  useRef,
} from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Table } from './components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Camera, List, FileText, PlusCircle, BarChart2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

// Context for global state management
const InventoryContext = createContext();

const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);

  // Fetch inventory from API/database
  useEffect(() => {
    // Replace with actual API call
    const fetchInventory = async () => {
      // const response = await fetch('/api/inventory');
      // const data = await response.json();
      // setInventory(data);
    };
    fetchInventory();
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        setInventory,
        currentInvoice,
        setCurrentInvoice,
        salesHistory,
        setSalesHistory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

const ProductScanner = () => {
  const [scannedData, setScannedData] = useState('No data scanned');
  const { inventory, setInventory } = useContext(InventoryContext);

  const handleScan = (data) => {
    if (data) {
      setScannedData(data);
      // Check if product exists and update quantity
      const existingProductIndex = inventory.findIndex(
        (item) => item.id === data
      );
      if (existingProductIndex !== -1) {
        const updatedInventory = [...inventory];
        updatedInventory[existingProductIndex].quantity += 1;
        setInventory(updatedInventory);
      } else {
        // Add new product if it doesn't exist
        setInventory([
          ...inventory,
          { id: data, name: `Product ${data}`, quantity: 1 },
        ]);
      }
    }
  };

  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const isScannerRunningRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    const config = { fps: 10, qrbox: 250 };

    scanner
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleScan(decodedText);
          setError(null);
        },
        (err) => {
          setError(err);
          console.info(error);
        }
      )
      .then(() => {
        isScannerRunningRef.current = true;
      })
      .catch((err) => {
        setError(err);
        console.error('Unable to start scanning', err);
      });

    return () => {
      if (isScannerRunningRef.current) {
        scanner
          .stop()
          .catch((err) => console.error('Unable to stop scanning', err));
      }
    };
  }, []);

  return (
    <>
      <h2>Scan Product</h2>
      <div id='qr-reader' ref={scannerRef} style={{ width: '100%' }} />
      <p>Scanned Data: {scannedData}</p>
      {/* {error && <p style={{ color: 'red' }}>{error}</p>} */}
    </>
  );
};

const ProductList = () => {
  const { inventory, setInventory } = useContext(InventoryContext);

  const handleQuantityChange = (id, newQuantity) => {
    const updatedInventory = inventory.map((item) =>
      item.id === id ? { ...item, quantity: parseInt(newQuantity) } : item
    );
    setInventory(updatedInventory);
  };

  return (
    <div>
      <h2>Product Inventory</h2>
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>QR Code</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>
                <Input
                  type='number'
                  value={product.quantity}
                  onChange={(e) =>
                    handleQuantityChange(product.id, e.target.value)
                  }
                  min='0'
                />
              </td>
              <td>
                <QRCodeSVG value={product.id} size={64} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

const InvoiceGenerator = () => {
  const {
    inventory,
    currentInvoice,
    setCurrentInvoice,
    salesHistory,
    setSalesHistory,
    setInventory,
  } = useContext(InventoryContext);
  const [scannedProduct, setScannedProduct] = useState('');

  const handleScan = (data) => {
    if (data) {
      setScannedProduct(data);
      const product = inventory.find((item) => item.id === data);
      if (product) {
        const existingItem = currentInvoice.find((item) => item.id === data);
        if (existingItem) {
          setCurrentInvoice(
            currentInvoice.map((item) =>
              item.id === data ? { ...item, quantity: item.quantity + 1 } : item
            )
          );
        } else {
          setCurrentInvoice([...currentInvoice, { ...product, quantity: 1 }]);
        }
      }
    }
  };

  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const isScannerRunningRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    const config = { fps: 10, qrbox: 250 };

    scanner
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleScan(decodedText);
          setError(null);
        },
        (err) => {
          setError(err);
          console.info(error);
        }
      )
      .then(() => {
        isScannerRunningRef.current = true;
      })
      .catch((err) => {
        setError(err);
        console.error('Unable to start scanning', err);
      });

    return () => {
      if (isScannerRunningRef.current) {
        scanner
          .stop()
          .catch((err) => console.error('Unable to stop scanning', err));
      }
    };
  }, []);

  const generateInvoice = () => {
    const invoiceTotal = currentInvoice.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const newInvoice = {
      id: uuidv4(),
      items: currentInvoice,
      total: invoiceTotal,
      date: new Date().toISOString(),
    };
    setSalesHistory([...salesHistory, newInvoice]);

    // Update inventory
    const updatedInventory = inventory.map((item) => {
      const invoiceItem = currentInvoice.find(
        (invItem) => invItem.id === item.id
      );
      return invoiceItem
        ? { ...item, quantity: item.quantity - invoiceItem.quantity }
        : item;
    });
    setInventory(updatedInventory);

    setCurrentInvoice([]);
  };

  return (
    <div>
      <h2>Generate Invoice</h2>
      <div id='qr-reader' ref={scannerRef} style={{ width: '100%' }} />
      {/* <QrReader
        delay={300}
        onResult={(result, error) => {
          if (result) {
            handleScan(result?.text);
          }
          if (error) {
            console.error(error);
          }
        }}
        style={{ width: '100%' }}
      /> */}
      <p>Scanned Product: {scannedProduct}</p>
      <h3>Current Invoice</h3>
      <ul>
        {currentInvoice.map((item, index) => (
          <li key={index}>
            {item.name} - Quantity: {item.quantity} - Price: $
            {item.price * item.quantity}
          </li>
        ))}
      </ul>
      <p>
        Total: $
        {currentInvoice.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )}
      </p>
      <Button onClick={generateInvoice}>Generate Invoice</Button>
    </div>
  );
};

const ProductCreator = () => {
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const { inventory, setInventory } = useContext(InventoryContext);

  const createProduct = () => {
    const newProduct = {
      id: uuidv4(),
      name: productName,
      price: parseFloat(productPrice),
      quantity: 0,
    };
    setInventory([...inventory, newProduct]);
    setProductName('');
    setProductPrice('');
  };

  return (
    <div>
      <h2>Create New Product</h2>
      <Input
        type='text'
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        placeholder='Enter product name'
      />
      <Input
        type='number'
        value={productPrice}
        onChange={(e) => setProductPrice(e.target.value)}
        placeholder='Enter product price'
        min='0'
        step='0.01'
      />
      <Button onClick={createProduct}>Create Product</Button>
    </div>
  );
};

const SalesAnalytics = () => {
  const { salesHistory } = useContext(InventoryContext);

  const totalSales = salesHistory.reduce(
    (total, invoice) => total + invoice.total,
    0
  );
  const averageSale = totalSales / salesHistory.length || 0;

  return (
    <div>
      <h2>Sales Analytics</h2>
      <p>Total Sales: ${totalSales.toFixed(2)}</p>
      <p>Number of Transactions: {salesHistory.length}</p>
      <p>Average Sale: ${averageSale.toFixed(2)}</p>
    </div>
  );
};

const App = () => {
  return (
    <InventoryProvider>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1>Inventory Management System</h1>
        <Tabs defaultValue='scan'>
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='scan'>
              <Camera size={20} />
            </TabsTrigger>
            <TabsTrigger value='inventory'>
              <List size={20} />
            </TabsTrigger>
            <TabsTrigger value='invoice'>
              <FileText size={20} />
            </TabsTrigger>
            <TabsTrigger value='create'>
              <PlusCircle size={20} />
            </TabsTrigger>
            <TabsTrigger value='analytics'>
              <BarChart2 size={20} />
            </TabsTrigger>
          </TabsList>
          <TabsContent value='scan'>
            <ProductScanner />
          </TabsContent>
          <TabsContent value='inventory'>
            <ProductList />
          </TabsContent>
          <TabsContent value='invoice'>
            <InvoiceGenerator />
          </TabsContent>
          <TabsContent value='create'>
            <ProductCreator />
          </TabsContent>
          <TabsContent value='analytics'>
            <SalesAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </InventoryProvider>
  );
};

export default App;
