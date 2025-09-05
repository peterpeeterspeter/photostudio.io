#!/usr/bin/env tsx
/**
 * Storage Cleanup Script for Virtual Try-On Feature
 * 
 * This script performs maintenance tasks on the storage system:
 * - Removes expired files from storage and database
 * - Cleans up orphaned database records
 * - Reports storage usage statistics
 * 
 * Should be run periodically (e.g., daily via cron job)
 * 
 * Usage:
 *   npm run cleanup:storage
 *   tsx scripts/cleanup-storage.ts [--dry-run] [--verbose] [--force-all]
 */

import { storageService } from '@/lib/tryon/storage';
import { supabaseService } from '@/lib/supabase';

interface CleanupOptions {
  dryRun: boolean;
  verbose: boolean;
  forceAll: boolean;
}

interface CleanupReport {
  expiredFilesDeleted: number;
  orphanedRecordsRemoved: number;
  storageFreed: number;
  errorsEncountered: number;
  totalFiles: number;
  totalStorage: number;
}

/**
 * Main cleanup function
 */
async function runCleanup(options: CleanupOptions): Promise<CleanupReport> {
  const supabase = supabaseService();
  const report: CleanupReport = {
    expiredFilesDeleted: 0,
    orphanedRecordsRemoved: 0,
    storageFreed: 0,
    errorsEncountered: 0,
    totalFiles: 0,
    totalStorage: 0
  };

  console.log('🧹 Starting storage cleanup...');
  if (options.dryRun) {
    console.log('📋 DRY RUN MODE - No changes will be made');
  }

  try {
    // Get current statistics
    await getCurrentStats(report);
    
    // Clean up expired files
    if (!options.dryRun) {
      await cleanupExpiredFiles(report, options);
    } else {
      await simulateExpiredCleanup(report, options);
    }
    
    // Clean up orphaned records
    if (!options.dryRun) {
      await cleanupOrphanedRecords(report, options);
    } else {
      await simulateOrphanedCleanup(report, options);
    }
    
    // Force cleanup all if requested
    if (options.forceAll && !options.dryRun) {
      await forceCleanupAll(report, options);
    }
    
    // Final statistics
    await getFinalStats(report);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    report.errorsEncountered++;
  }

  return report;
}

/**
 * Get current storage statistics
 */
async function getCurrentStats(report: CleanupReport): Promise<void> {
  console.log('📊 Gathering current statistics...');
  
  const supabase = supabaseService();
  
  // Count total files
  const { data: files, error: filesError } = await supabase
    .from('tryon_files')
    .select('file_size');
  
  if (filesError) {
    console.error('Failed to get file statistics:', filesError);
    return;
  }
  
  report.totalFiles = files?.length || 0;
  report.totalStorage = files?.reduce((total, file) => total + (file.file_size || 0), 0) || 0;
  
  console.log(`📁 Total files: ${report.totalFiles}`);
  console.log(`💾 Total storage: ${formatBytes(report.totalStorage)}`);
}

/**
 * Clean up expired files
 */
async function cleanupExpiredFiles(report: CleanupReport, options: CleanupOptions): Promise<void> {
  console.log('🗑️ Cleaning up expired files...');
  
  const result = await storageService.cleanupExpiredFiles();
  
  if (result.success) {
    report.expiredFilesDeleted = result.data!;
    console.log(`✅ Deleted ${report.expiredFilesDeleted} expired files`);
  } else {
    console.error('❌ Failed to cleanup expired files:', result.error);
    report.errorsEncountered++;
  }
}

/**
 * Simulate expired file cleanup (dry run)
 */
async function simulateExpiredCleanup(report: CleanupReport, options: CleanupOptions): Promise<void> {
  console.log('🔍 Simulating expired file cleanup...');
  
  const supabase = supabaseService();
  const { data: expiredFiles, error } = await supabase
    .from('tryon_files')
    .select('file_id, file_size, storage_path')
    .lt('expires_at', new Date().toISOString());
  
  if (error) {
    console.error('Failed to query expired files:', error);
    report.errorsEncountered++;
    return;
  }
  
  report.expiredFilesDeleted = expiredFiles?.length || 0;
  report.storageFreed = expiredFiles?.reduce((total, file) => total + (file.file_size || 0), 0) || 0;
  
  console.log(`📋 Would delete ${report.expiredFilesDeleted} expired files`);
  console.log(`📋 Would free ${formatBytes(report.storageFreed)} of storage`);
  
  if (options.verbose && expiredFiles) {
    console.log('📋 Expired files:');
    expiredFiles.slice(0, 10).forEach(file => {
      console.log(`   - ${file.file_id} (${formatBytes(file.file_size || 0)})`);
    });
    if (expiredFiles.length > 10) {
      console.log(`   ... and ${expiredFiles.length - 10} more`);
    }
  }
}

/**
 * Clean up orphaned database records (files with no storage)
 */
async function cleanupOrphanedRecords(report: CleanupReport, options: CleanupOptions): Promise<void> {
  console.log('🔍 Cleaning up orphaned records...');
  
  // This would require checking if files exist in storage
  // For now, we'll just clean up very old records (90+ days)
  const supabase = supabaseService();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  
  const { data: oldRecords, error: queryError } = await supabase
    .from('tryon_files')
    .select('file_id')
    .lt('created_at', cutoffDate.toISOString());
  
  if (queryError) {
    console.error('Failed to query old records:', queryError);
    report.errorsEncountered++;
    return;
  }
  
  if (oldRecords && oldRecords.length > 0) {
    const { error: deleteError } = await supabase
      .from('tryon_files')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
    
    if (deleteError) {
      console.error('Failed to delete old records:', deleteError);
      report.errorsEncountered++;
    } else {
      report.orphanedRecordsRemoved = oldRecords.length;
      console.log(`✅ Removed ${report.orphanedRecordsRemoved} old records`);
    }
  } else {
    console.log('✅ No old records to remove');
  }
}

/**
 * Simulate orphaned record cleanup (dry run)
 */
async function simulateOrphanedCleanup(report: CleanupReport, options: CleanupOptions): Promise<void> {
  console.log('🔍 Simulating orphaned record cleanup...');
  
  const supabase = supabaseService();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  
  const { data: oldRecords, error } = await supabase
    .from('tryon_files')
    .select('file_id')
    .lt('created_at', cutoffDate.toISOString());
  
  if (error) {
    console.error('Failed to query old records:', error);
    report.errorsEncountered++;
    return;
  }
  
  report.orphanedRecordsRemoved = oldRecords?.length || 0;
  console.log(`📋 Would remove ${report.orphanedRecordsRemoved} old records`);
}

/**
 * Force cleanup all files (dangerous - for development only)
 */
async function forceCleanupAll(report: CleanupReport, options: CleanupOptions): Promise<void> {
  console.log('⚠️ FORCE CLEANUP ALL FILES...');
  console.log('⚠️ This will delete ALL files in the try-on storage!');
  
  const supabase = supabaseService();
  
  // Delete all files from database
  const { error: dbError } = await supabase
    .from('tryon_files')
    .delete()
    .neq('file_id', ''); // Delete all records
  
  if (dbError) {
    console.error('Failed to delete all records:', dbError);
    report.errorsEncountered++;
    return;
  }
  
  // Delete all files from storage bucket
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('tryon-uploads')
      .list();
    
    if (listError) {
      console.error('Failed to list storage files:', listError);
      report.errorsEncountered++;
      return;
    }
    
    if (files && files.length > 0) {
      const filePaths = files.map(file => file.name);
      const { error: deleteError } = await supabase.storage
        .from('tryon-uploads')
        .remove(filePaths);
      
      if (deleteError) {
        console.error('Failed to delete storage files:', deleteError);
        report.errorsEncountered++;
      } else {
        console.log(`✅ Force deleted ${filePaths.length} files from storage`);
      }
    }
  } catch (error) {
    console.error('Force cleanup error:', error);
    report.errorsEncountered++;
  }
}

/**
 * Get final statistics after cleanup
 */
async function getFinalStats(report: CleanupReport): Promise<void> {
  console.log('📊 Final statistics...');
  
  const supabase = supabaseService();
  
  const { data: files, error } = await supabase
    .from('tryon_files')
    .select('file_size');
  
  if (!error && files) {
    const finalFiles = files.length;
    const finalStorage = files.reduce((total, file) => total + (file.file_size || 0), 0);
    
    console.log(`📁 Files after cleanup: ${finalFiles} (was ${report.totalFiles})`);
    console.log(`💾 Storage after cleanup: ${formatBytes(finalStorage)} (was ${formatBytes(report.totalStorage)})`);
    
    if (report.storageFreed > 0) {
      console.log(`🎉 Storage freed: ${formatBytes(report.storageFreed)}`);
    }
  }
}

/**
 * Format bytes in human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Print cleanup report
 */
function printReport(report: CleanupReport, options: CleanupOptions): void {
  console.log('\n📋 CLEANUP REPORT');
  console.log('==================');
  console.log(`Expired files ${options.dryRun ? 'to be ' : ''}deleted: ${report.expiredFilesDeleted}`);
  console.log(`Orphaned records ${options.dryRun ? 'to be ' : ''}removed: ${report.orphanedRecordsRemoved}`);
  if (report.storageFreed > 0) {
    console.log(`Storage ${options.dryRun ? 'to be ' : ''}freed: ${formatBytes(report.storageFreed)}`);
  }
  if (report.errorsEncountered > 0) {
    console.log(`⚠️ Errors encountered: ${report.errorsEncountered}`);
  }
  console.log('==================\n');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  const options: CleanupOptions = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    forceAll: args.includes('--force-all')
  };
  
  if (args.includes('--help')) {
    console.log(`
Storage Cleanup Script for Virtual Try-On Feature

Usage:
  tsx scripts/cleanup-storage.ts [options]

Options:
  --dry-run      Show what would be deleted without making changes
  --verbose      Show detailed information about files being processed
  --force-all    Delete ALL files (DANGEROUS - development only)
  --help         Show this help message

Examples:
  tsx scripts/cleanup-storage.ts --dry-run
  tsx scripts/cleanup-storage.ts --verbose
  tsx scripts/cleanup-storage.ts --force-all
    `);
    process.exit(0);
  }
  
  if (options.forceAll) {
    console.log('⚠️ WARNING: --force-all will delete ALL files!');
    console.log('⚠️ This should only be used in development!');
    
    // Add a 5-second delay for safety
    console.log('⚠️ Continuing in 5 seconds... Press Ctrl+C to cancel');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  try {
    const report = await runCleanup(options);
    printReport(report, options);
    
    if (report.errorsEncountered > 0) {
      console.log('❌ Cleanup completed with errors');
      process.exit(1);
    } else {
      console.log('✅ Cleanup completed successfully');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
