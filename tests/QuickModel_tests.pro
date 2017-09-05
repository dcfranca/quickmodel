TEMPLATE = app

QT += qml quick widgets

CONFIG += qmltestcase

SOURCES += main.cpp

RESOURCES += qml.qrc

# Default rules for deployment.
include($$PWD/../QuickModel.pri)
