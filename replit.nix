{pkgs}: {
  deps = [
    pkgs.xorg.libX11
    pkgs.xorg.libxcb
    pkgs.ffmpeg
  ];
}
