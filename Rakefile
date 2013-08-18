STDOUT.sync = true
BASE_DIR = File.dirname(__FILE__)

puts "BASE_DIR = #{BASE_DIR}"

EXTENSION_DIR = File.join(BASE_DIR, "extension")

task :default => [:package]

# These two possibly not necessary, but included for future reference ...
EXTENSION_ID = ENV["STYLE_ADJUSTER_CHROME_EXTENSION_ID"] || "__MSG_@@extension_id__"
CHROME_EXTENSION_URL_PREFIX = "chrome-extension://#{EXTENSION_ID}/"

BUILD_DIR = File.join(BASE_DIR, "build")
BUILD_EXTENSION_DIR = File.join(BUILD_DIR, "extension")

task :extension do
  FileUtils.mkdir_p BUILD_DIR, :verbose => true
  FileUtils.cp_r EXTENSION_DIR, BUILD_DIR, :verbose => true
  Dir.glob(File.join(BUILD_EXTENSION_DIR, "*.scss")) do |file|
    FileUtils.rm file, :verbose => true
  end
end

EXTENSION_ZIP_FILE = File.join(BASE_DIR, "build/extension.zip")

task :package => [:clean, :extension] do
  FileUtils.rm_f EXTENSION_ZIP_FILE, :verbose => true
  Dir.chdir(BUILD_EXTENSION_DIR) do # note - there is no other way to tell zip the base dir for relative paths
    system("zip -r #{EXTENSION_ZIP_FILE} .")
  end
  puts "Built zip file #{EXTENSION_ZIP_FILE}"
end

task :clean do
  if Dir.exists? BUILD_DIR
    FileUtils.rm_r BUILD_DIR, :verbose => true
  end
end
