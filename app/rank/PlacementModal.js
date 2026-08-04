'use client';

import VideoTile from './VideoTile';
import styles from './theme-rank.module.css';

export default function PlacementModal({ list, candidate, center, onMoveBy, onConfirm, onCancel }) {
  const above = center > 0 ? list[center - 1] : null;
  const below = center < list.length ? list[center] : null;

  const atTop = center === 0;
  const atBottom = center === list.length;
  const show5 = list.length >= 5;
  const show10 = list.length >= 10;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button type="button" className={styles.modalClose} onClick={onCancel} aria-label="Cancel">
          ✕
        </button>

        <p className={styles.modalHint}>
          All three play muted — hover a video to hear its audio. Use the
          buttons to move it up or down until it's in the right spot, then
          confirm.
        </p>

        <div className={styles.compareRow}>
          <div className={styles.compareSlot}>
            <span className={styles.compareLabel}>{above ? `Currently #${center}` : 'Top of list'}</span>
            {above ? <VideoTile track={above} /> : <div className={styles.emptySlot}>Nothing ranked higher</div>}
          </div>

          <div className={styles.compareSlot}>
            <span className={styles.compareLabelCandidate}>Placing</span>
            <VideoTile track={candidate} />
          </div>

          <div className={styles.compareSlot}>
            <span className={styles.compareLabel}>
              {below ? `Currently #${center + 2}` : 'Bottom of list'}
            </span>
            {below ? <VideoTile track={below} /> : <div className={styles.emptySlot}>Nothing ranked lower</div>}
          </div>
        </div>

        <div className={styles.modalActions}>
          <div className={styles.modalButtonGroup}>
            {show10 && (
              <button type="button" onClick={() => onMoveBy(-10)} disabled={atTop} className={styles.modalButton}>
                ▲ Rank 10 Higher
              </button>
            )}
            {show5 && (
              <button type="button" onClick={() => onMoveBy(-5)} disabled={atTop} className={styles.modalButton}>
                ▲ Rank 5 Higher
              </button>
            )}
            <button type="button" onClick={() => onMoveBy(-1)} disabled={atTop} className={styles.modalButton}>
              ▲ Rank Higher
            </button>
          </div>

          <button type="button" onClick={onConfirm} className={styles.modalConfirm}>
            Confirm at #{center + 1}
          </button>

          <div className={styles.modalButtonGroup}>
            <button type="button" onClick={() => onMoveBy(1)} disabled={atBottom} className={styles.modalButton}>
              ▼ Rank Lower
            </button>
            {show5 && (
              <button type="button" onClick={() => onMoveBy(5)} disabled={atBottom} className={styles.modalButton}>
                ▼ Rank 5 Lower
              </button>
            )}
            {show10 && (
              <button type="button" onClick={() => onMoveBy(10)} disabled={atBottom} className={styles.modalButton}>
                ▼ Rank 10 Lower
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
