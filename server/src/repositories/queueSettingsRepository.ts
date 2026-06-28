import { QueueSettings, IQueueSettings, QueueSettingsDocument } from '../models/QueueSettings';

// ─────────────────────────────────────────────
// Repository Class
// ─────────────────────────────────────────────

export class QueueSettingsRepository {
  private readonly DEFAULT_DEPT = 'GEN';

  /**
   * Get the settings document for a department.
   * Automatically creates one if it doesn't exist.
   * Automatically resets token counters if the date has advanced (daily reset).
   */
  async getOrInitialize(
    departmentCode: string = this.DEFAULT_DEPT,
    today: string
  ): Promise<QueueSettingsDocument> {
    let settings = await QueueSettings.findOneAndUpdate(
      { departmentCode },
      {
        $setOnInsert: {
          departmentCode,
          lastResetDate: today,
          currentToken: 0,
          lastIssuedToken: 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Daily reset: if the calendar day has changed, reset all counters atomically and safely
    if (settings.lastResetDate !== today) {
      const resetSettings = await QueueSettings.findOneAndUpdate(
        { departmentCode, lastResetDate: { $ne: today } },
        {
          $set: {
            currentToken: 0,
            lastIssuedToken: 0,
            lastResetDate: today,
          },
        },
        { new: true }
      );
      if (resetSettings) {
        settings = resetSettings;
      } else {
        const freshSettings = await QueueSettings.findOne({ departmentCode });
        if (freshSettings) {
          settings = freshSettings;
        }
      }
    }

    return settings;
  }

  /**
   * Atomically increment lastIssuedToken and return the new value.
   * This is the token-generation operation — must be atomic to prevent duplicates.
   */
  async issueNextToken(
    departmentCode: string = this.DEFAULT_DEPT,
    today: string
  ): Promise<number> {
    // Ensure settings are initialized/reset for the day atomically
    await this.getOrInitialize(departmentCode, today);

    // Atomically increment and return the token
    const settings = await QueueSettings.findOneAndUpdate(
      { departmentCode },
      { $inc: { lastIssuedToken: 1 } },
      { new: true }
    );

    if (!settings) {
      throw new Error('Failed to issue next token: settings not found.');
    }

    return settings.lastIssuedToken;
  }

  /**
   * Update currentToken to reflect the patient now being served.
   * Called every time the receptionist calls the next patient.
   */
  async setCurrentToken(
    departmentCode: string = this.DEFAULT_DEPT,
    token: number
  ): Promise<QueueSettingsDocument | null> {
    return QueueSettings.findOneAndUpdate(
      { departmentCode },
      { $set: { currentToken: token } },
      { new: true }
    ).exec();
  }

  /**
   * Update the average consultation time (minutes per patient).
   * Affects estimated wait time calculations for all waiting patients.
   */
  async updateAverageConsultationTime(
    departmentCode: string = this.DEFAULT_DEPT,
    minutes: number
  ): Promise<QueueSettingsDocument | null> {
    return QueueSettings.findOneAndUpdate(
      { departmentCode },
      { $set: { averageConsultationTime: minutes } },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Open or close the queue. When closed, new patients cannot register.
   */
  async setQueueOpen(
    departmentCode: string = this.DEFAULT_DEPT,
    isOpen: boolean
  ): Promise<QueueSettingsDocument | null> {
    return QueueSettings.findOneAndUpdate(
      { departmentCode },
      { $set: { isQueueOpen: isOpen } },
      { new: true }
    ).exec();
  }

  /**
   * Get current settings snapshot without any side effects.
   * Used for queue status queries.
   */
  async get(departmentCode: string = this.DEFAULT_DEPT): Promise<IQueueSettings | null> {
    return QueueSettings.findOne({ departmentCode }).lean().exec();
  }
}

export const queueSettingsRepository = new QueueSettingsRepository();
