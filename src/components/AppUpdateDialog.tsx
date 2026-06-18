import { Root, Portal, Overlay, Content, Title, Close } from '@radix-ui/react-dialog';
import { Download, X, RefreshCw, AlertCircle, Clock } from 'lucide-react';

interface AppUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
  updateInfo: {
    version: string;
    build: number;
    changelog?: string;
    mandatory: boolean;
  };
  isMandatoryBlocked?: boolean;
  daysRemaining?: number;
  downloading?: boolean;
}

export const AppUpdateDialog = ({
  open,
  onOpenChange,
  onDownload,
  updateInfo,
  isMandatoryBlocked = false,
  daysRemaining = 0,
  downloading = false,
}: AppUpdateDialogProps) => {
  const isBlocked = updateInfo.mandatory && !isMandatoryBlocked;

  return (
    <Root open={open} onOpenChange={isBlocked ? () => {} : onOpenChange}>
      <Portal>
        <Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 100,
          }}
        />
        <Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '480px',
            width: '90%',
            zIndex: 101,
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <Title style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isBlocked ? (
                <AlertCircle size={24} color="var(--danger)" />
              ) : (
                <RefreshCw size={24} color="var(--accent-primary)" />
              )}
              Actualizacion disponible
            </Title>
            {!isBlocked && (
              <Close asChild>
                <button
                  aria-label="Cerrar"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={20} color="var(--text-muted)" />
                </button>
              </Close>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Version <strong>{updateInfo.version}</strong> (build {updateInfo.build}) disponible para descargar.
            </p>
            {isMandatoryBlocked && daysRemaining > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--warning)', fontSize: '14px' }}>
                <Clock size={16} />
                <span>Quedan {daysRemaining} dia{ daysRemaining !== 1 ? 's' : '' } para que esta actualizacion sea obligatoria.</span>
              </div>
            )}
            {isBlocked && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--danger)', fontSize: '14px' }}>
                <AlertCircle size={16} />
                <span>Debes actualizar para continuar usando la app.</span>
              </div>
            )}
            {updateInfo.changelog && (
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '12px', maxHeight: '150px', overflow: 'auto' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{updateInfo.changelog}</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            {!isBlocked && (
              <Close asChild>
                <button
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {isMandatoryBlocked ? 'Recordarmelo manana' : 'Mas tarde'}
                </button>
              </Close>
            )}
            <button
              onClick={onDownload}
              disabled={downloading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: isBlocked ? 'var(--danger)' : 'var(--accent-primary)',
                color: 'white',
                cursor: downloading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: downloading ? 0.7 : 1,
              }}
            >
              <Download size={16} />
              {downloading ? 'Descargando...' : 'Descargar actualizacion'}
            </button>
          </div>
        </Content>
      </Portal>
    </Root>
  );
};
