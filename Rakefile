
STDOUT.sync = true
BASE_DIR = File.dirname(__FILE__)

EXTENSION_DIR = File.join(BASE_DIR, "extension")

IMAGE_CSS_FILES = ["extension/libs/jquery-ui-1.10.3/themes/base/jquery-ui.css"]

task :default => [:package]

EXTENSION_ID = ENV["STYLE_ADJUSTER_CHROME_EXTENSION_ID"] || "__MSG_@@extension_id__"

CHROME_EXTENSION_URL_PREFIX = "chrome-extension://#{EXTENSION_ID}/"

BUILD_DIR = File.join(BASE_DIR, "build");
BUILD_EXTENSION_DIR = File.join(BASE_DIR, "build/extension");

task :package do
  FileUtils.rm_r BUILD_DIR, :verbose => true
  FileUtils.mkdir_p BUILD_DIR, :verbose => true
  FileUtils.cp_r EXTENSION_DIR, BUILD_DIR, :verbose => true
  Dir.glob(File.join(BUILD_EXTENSION_DIR, "*.scss")) do |file|
    FileUtils.rm file, :verbose => true
  end
end


