import './components/Citadel/CitadelElement';
import styles from './App.module.css';
import './components/Citadel/types/custom-elements';

function App() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <p className={styles.text}>
          Press <code className={styles.keyCode}>/</code> to<br />activate Citadel
        </p>
        <citadel-element></citadel-element>
      </div>
    </div>
  );
}

export default App;
