Pod::Spec.new do |s|
  s.name = 'SalutecaPreview'
  s.version = '0.1.0'
  s.summary = 'Private temporary PDF preview for Mi Saluteca'
  s.description = s.summary
  s.author = 'Mi Saluteca'
  s.homepage = 'https://github.com/MatyAlts/MiSaluteca-ios'
  s.license = 'MIT'
  s.platforms = { :ios => '16.4' }
  s.source = { :git => 'https://github.com/MatyAlts/MiSaluteca-ios.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.swift_version = '5.9'
  s.source_files = '**/*.{h,m,mm,swift}'
end
