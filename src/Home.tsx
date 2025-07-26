import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Calendar, Award, Headphones, Play } from 'lucide-react';

function Home() {
  const navigate = useNavigate();
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState({
    'Dünya Gül Bana': 342,
    'Böyle İyi': 287
  });

  const handleVote = (song: string) => {
    if (hasVoted) return;
    
    setSelectedSong(song);
    setVotes(prev => ({
      ...prev,
      [song]: prev[song] + 1
    }));
    setHasVoted(true);
    
    // "Böyle İyi" seçilirse /login sayfasına yönlendir
    if (song === 'Böyle İyi') {
      setTimeout(() => {
        navigate('/login');
      }, 500); // 0.5 saniye sonra yönlendir
    }
  };

  const totalVotes = votes['Dünya Gül Bana'] + votes['Böyle İyi'];
  const getPercentage = (songVotes: number) => {
    return totalVotes > 0 ? ((songVotes / totalVotes) * 100).toFixed(1) : 0;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="py-16 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <img 
              src="/images.jpg" 
              alt="Can Bozok" 
              className="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-2 border-gray-800"
            />
            <h1 className="text-4xl md:text-5xl font-light mb-4 tracking-wide" style={{fontFamily: 'Georgia, serif'}}>
              NO.1
            </h1>
            <div className="w-16 h-px bg-white mx-auto mb-4"></div>
            <p className="text-lg text-gray-400 font-light">
              Can Bozok
            </p>
            <p className="text-gray-500 mt-2 text-sm">
              Türk Rap'in Efsane İsmi
            </p>
          </div>
        </div>
      </section>

      {/* Biography Section */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light mb-3" style={{fontFamily: 'Georgia, serif'}}>Biyografi</h2>
            <div className="w-12 h-px bg-white mx-auto"></div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-900/20 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-white" />
                <h3 className="text-base font-medium">Erken Dönem</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm">
                19 Mayıs 1988 tarihinde dünyaya gelen No.1 (Can Bozok), eğitim hayatını yarıda bırakarak çeşitli işlerde çalıştı. 
                Rap müziğe başlamadan önce matbaa fabrikasında çalışan sanatçı, 2000'li yılların başında müziğe adım attı.
              </p>
            </div>
            
            <div className="bg-gray-900/20 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-5 h-5 text-white" />
                <h3 className="text-base font-medium">Müzik Kariyeri</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm">
                FL Studio programıyla rap müziğe ilk adımını atan No.1, 2003'te ilk şarkılarını üretti. 
                2004'te "Çalıntı Mikrofon" albümüyle kariyerine başladı. 2011'de "Bu Benim Hayatım" şarkısıyla büyük çıkış yakaladı.
              </p>
            </div>
            
            <div className="bg-gray-900/20 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-white" />
                <h3 className="text-base font-medium">Başarılar</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm">
                2017'de "Siyah Bayrak" albümündeki "Dünya Gül Bana" ve "Hiç Işık Yok" şarkılarıyla büyük hayran kitlesi elde etti. 
                2021'de "Kron1k" albümü ve 2022'de Warner Music Group'un "Tirat" albümüne katılımıyla kariyerini sürdürüyor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Poll Section */}
      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-light mb-3" style={{fontFamily: 'Georgia, serif'}}>En İyi Şarkı</h2>
            <p className="text-gray-400">Favorinizi seçin</p>
            <div className="w-12 h-px bg-white mx-auto mt-2"></div>
          </div>

          <div className="bg-gray-900/20 rounded-lg p-4 border border-gray-800">
            <div className="space-y-3">
              {Object.entries(votes).map(([song, songVotes]) => (
                <button
                  key={song}
                  onClick={() => handleVote(song)}
                  disabled={hasVoted}
                  className={`w-full p-3 rounded-lg border transition-all duration-300 ${
                    hasVoted 
                      ? selectedSong === song 
                        ? 'border-white bg-white/5' 
                        : 'border-gray-700 bg-gray-800/20'
                      : 'border-gray-700 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-800/50'
                  } ${hasVoted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-white font-medium text-sm">{song}</span>
                    </div>
                    {hasVoted && (
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          {getPercentage(songVotes)}%
                        </div>
                        <div className="text-gray-400 text-xs">
                          {songVotes} oy
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {hasVoted && (
                    <div className="mt-2 bg-gray-700 rounded-full h-1 overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-1000 ease-out"
                        style={{ width: `${getPercentage(songVotes)}%` }}
                      ></div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {hasVoted && (
              <div className="mt-4 text-center">
                <p className="text-gray-400 text-xs mb-2">
                  Toplam {totalVotes} oy kullanıldı
                </p>
                <button
                  onClick={() => {
                    setHasVoted(false);
                    setSelectedSong(null);
                  }}
                  className="px-3 py-1 bg-white text-black rounded text-xs font-medium hover:bg-gray-200 transition-colors duration-300"
                >
                  Tekrar Oyla
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Discography */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light mb-3" style={{fontFamily: 'Georgia, serif'}}>Popüler Şarkılar</h2>
            <div className="w-12 h-px bg-white mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Dünya Gül Bana", album: "Siyah Bayrak", year: "2017" },
              { title: "Bu Benim Hayatım", album: "Single", year: "2011" },
              { title: "Hiç Işık Yok", album: "Siyah Bayrak", year: "2017" },
              { title: "Canavar", album: "Single", year: "2020" }
            ].map((song, index) => (
              <div key={index} className="bg-gray-900/20 rounded-lg p-3 border border-gray-800 hover:border-gray-600 transition-all duration-300">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">{song.title}</h3>
                    <p className="text-gray-400 text-xs">{song.album} • {song.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Music className="w-5 h-5 text-white" />
            <span className="font-light text-white" style={{fontFamily: 'Georgia, serif'}}>NO.1</span>
          </div>
          <p className="text-gray-400 text-xs">
            Can Bozok Resmi Hayran Sayfası
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home; 