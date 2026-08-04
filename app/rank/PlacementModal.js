'use client';

import VideoTile from './VideoTile';
import styles from './theme-rank.module.css';

export default function PlacementModal({
  list,
  candidate,
  center,
  onMoveUp,
  onMoveDown,
  onConfirm,
  onCancel,
}) {
  const above = center > 0 ? list[center - 1] : null;
  const below = center < list.length ? list[center] : null;

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
          <button type="button" onClick={onMoveUp} disabled={center === 0} className={styles.modalButton}>
            ▲ Rank Higher
          </button>
          <button type="button" onClick={onConfirm} className={styles.modalConfirm}>
            Confirm at #{center + 1}
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={center === list.length}
            className={styles.modalButton}
          >
            ▼ Rank Lower
          </button>
        </div>
      </div>
    </div>
  );
}
